import type { ServerContext } from '../server.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { switchTierToolDef, handleSwitchTier } from './switch-tier.js';
import { setAutoModeToolDef, handleSetAutoMode } from './auto-mode.js';
import { getStatusToolDef, handleGetStatus } from './status.js';
import { orchestrateToolDef, handleOrchestrate } from './orchestrate.js';
import { setBudgetToolDef, handleSetBudget } from './budget.js';

/**
 * Get all tool definitions
 */
export function getToolDefinitions(): Tool[] {
  return [
    switchTierToolDef as Tool,
    setAutoModeToolDef as Tool,
    getStatusToolDef as Tool,
    orchestrateToolDef as Tool,
    setBudgetToolDef as Tool,
  ];
}

/**
 * Handle a tool call
 */
export function handleToolCall(
  toolName: string,
  args: Record<string, unknown> | undefined,
  context: ServerContext
): { content: Array<{ type: 'text'; text: string }> } {
  const safeArgs = args || {};

  switch (toolName) {
    case 'switch_tier':
      return handleSwitchTier(safeArgs, context);

    case 'set_auto_mode':
      return handleSetAutoMode(safeArgs, context);

    case 'get_status':
      return handleGetStatus(safeArgs, context);

    case 'orchestrate':
      return handleOrchestrate(safeArgs, context);

    case 'set_budget':
      return handleSetBudget(safeArgs, context);

    default:
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${toolName}. Available tools: switch_tier, set_auto_mode, get_status, orchestrate, set_budget`,
          },
        ],
      };
  }
}
