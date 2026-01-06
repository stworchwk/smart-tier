import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import type { MergedConfig } from './config/schema.js';
import type { ServerState, Tier, StrategyType } from './types/index.js';
import { CostTracker } from './tracking/cost-tracker.js';
import { ConversationMemoryTracker } from './tracking/memory.js';
import { RuleEngine } from './rules/rule-engine.js';
import { createProviderFactory, type ProviderFactory } from './providers/index.js';
import { getToolDefinitions, handleToolCall } from './tools/index.js';
import { initFormatter, type Formatter as FormatterType } from './utils/formatter.js';

export interface ServerContext {
  config: MergedConfig;
  state: ServerState;
  providerFactory: ProviderFactory;
  costTracker: CostTracker;
  memoryTracker: ConversationMemoryTracker;
  ruleEngine: RuleEngine;
  formatter: FormatterType;
}

export function createServer(config: MergedConfig, dataPath: string): Server {
  // Initialize state
  const initialTier = config.defaults.strategy === '2-tier' ? 'primary' : 'tier1';
  // Check for NO_COLOR environment variable (https://no-color.org/)
  const useEmojis = process.env.NO_COLOR === undefined;
  const state: ServerState = {
    currentTier: initialTier as Tier,
    strategy: config.defaults.strategy,
    autoMode: true,
    useEmojis,
  };

  // Initialize components
  const providerFactory = createProviderFactory(config.providers);
  const costTracker = new CostTracker(dataPath);
  const memoryTracker = new ConversationMemoryTracker(dataPath);
  const ruleEngine = new RuleEngine(config.rules, config.defaults.strategy, memoryTracker);
  const formatter = initFormatter(useEmojis);

  // Create context
  const context: ServerContext = {
    config,
    state,
    providerFactory,
    costTracker,
    memoryTracker,
    ruleEngine,
    formatter,
  };

  // Create MCP server
  const server = new Server(
    {
      name: 'model-optimizer',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: getToolDefinitions(),
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, args, context);
  });

  return server;
}

export async function startServer(config: MergedConfig, dataPath: string): Promise<void> {
  const server = createServer(config, dataPath);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr (stdout is for MCP protocol)
  console.error('Model Optimizer MCP Server started');
  console.error(`Strategy: ${config.defaults.strategy}`);
  console.error(`Default provider: ${config.defaults.provider}`);
}

/**
 * Switch the current tier
 */
export function switchTier(context: ServerContext, tier: Tier, reason?: string): void {
  const previousTier = context.state.currentTier;
  context.state.currentTier = tier;

  // Log the switch
  console.error(`[model-optimizer] Switched tier: ${previousTier} -> ${tier}${reason ? ` (${reason})` : ''}`);

  // Record in memory for learning
  context.memoryTracker.recordTierSwitch(previousTier, tier, reason);
}

/**
 * Get the current model for the active tier
 */
export function getCurrentModel(context: ServerContext): { provider: string; model: string; modelId: string } {
  const { state, config } = context;
  const tierModels = config.defaults.tier_models[state.strategy];

  // Get model reference based on current tier
  let modelRef: string | undefined;
  if (state.strategy === '2-tier') {
    const twoTierModels = tierModels as { primary: string; critical: string };
    modelRef = state.currentTier === 'primary' ? twoTierModels.primary : twoTierModels.critical;
  } else {
    const threeTierModels = tierModels as { tier1: string; tier2: string; tier3: string };
    modelRef = threeTierModels[state.currentTier as 'tier1' | 'tier2' | 'tier3'];
  }

  if (!modelRef) {
    throw new Error(`No model configured for tier: ${state.currentTier}`);
  }

  const [provider, model] = modelRef.split(':');
  const providerConfig = config.providers[provider];
  if (!providerConfig) {
    throw new Error(`Provider not found: ${provider}`);
  }

  const modelConfig = providerConfig.models[model];
  if (!modelConfig) {
    throw new Error(`Model not found: ${model} in provider ${provider}`);
  }

  return { provider, model, modelId: modelConfig.id };
}

/**
 * Set the strategy type
 */
export function setStrategy(context: ServerContext, strategy: StrategyType): void {
  const previousStrategy = context.state.strategy;
  context.state.strategy = strategy;

  // Reset tier to default for new strategy
  context.state.currentTier = strategy === '2-tier' ? 'primary' : 'tier1';

  // Update rule engine
  context.ruleEngine.setStrategy(strategy);

  console.error(`[model-optimizer] Strategy changed: ${previousStrategy} -> ${strategy}`);
}
