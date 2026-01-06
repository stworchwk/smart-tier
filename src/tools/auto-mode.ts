import type { ServerContext } from '../server.js';
import type { StrategyType } from '../types/index.js';
import { setStrategy } from '../server.js';

export const setAutoModeToolDef = {
  name: 'set_auto_mode',
  description:
    'Enable or disable automatic model selection based on task classification. Optionally switch between 2-tier and 3-tier strategies.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      enabled: {
        type: 'boolean',
        description: 'Whether to enable auto mode',
      },
      strategy: {
        type: 'string',
        enum: ['2-tier', '3-tier'],
        description: 'Optional: Switch to a different tier strategy',
      },
    },
    required: ['enabled'],
  },
};

export function handleSetAutoMode(
  args: Record<string, unknown>,
  context: ServerContext
): { content: Array<{ type: 'text'; text: string }> } {
  const enabled = args.enabled as boolean;
  const strategy = args.strategy as StrategyType | undefined;

  // Update auto mode
  const previousAutoMode = context.state.autoMode;
  context.state.autoMode = enabled;

  // Update strategy if provided
  let strategyChanged = false;
  let previousStrategy = context.state.strategy;
  if (strategy && strategy !== context.state.strategy) {
    previousStrategy = context.state.strategy;
    setStrategy(context, strategy);
    strategyChanged = true;
  }

  // Build response message
  const messages: string[] = [];

  if (previousAutoMode !== enabled) {
    messages.push(`Auto mode ${enabled ? 'enabled' : 'disabled'}`);
  } else {
    messages.push(`Auto mode is already ${enabled ? 'enabled' : 'disabled'}`);
  }

  if (strategyChanged) {
    messages.push(`Strategy changed from ${previousStrategy} to ${strategy}`);
    messages.push(`Current tier reset to: ${context.state.currentTier}`);
  }

  if (enabled) {
    messages.push('');
    messages.push('Auto mode will automatically select the appropriate tier based on:');
    messages.push('- Task keywords (architecture, security, explore, implement, etc.)');
    messages.push('- Error escalation (after 3 consecutive errors)');
    messages.push('- Conversation memory patterns');
  }

  return {
    content: [
      {
        type: 'text',
        text: messages.join('\n'),
      },
    ],
  };
}
