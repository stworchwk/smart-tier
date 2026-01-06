import type { ServerContext } from '../server.js';
import type { Tier } from '../types/index.js';
import { switchTier, getCurrentModel } from '../server.js';

// Constants for display formatting
const TASK_SUMMARY_MAX_LENGTH = 100;

/**
 * Orchestrate tool definition
 */
export const orchestrateToolDef = {
  name: 'orchestrate',
  description:
    'Classify a task and optionally route it to the appropriate model tier. Returns the recommended tier and can automatically switch if auto mode is enabled.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task: {
        type: 'string',
        description: 'The task description to classify',
      },
      context: {
        type: 'object',
        description: 'Optional context about the task',
      },
      force_tier: {
        type: 'string',
        enum: ['primary', 'critical', 'tier1', 'tier2', 'tier3'],
        description: 'Force a specific tier instead of auto-selecting',
      },
      auto_switch: {
        type: 'boolean',
        default: true,
        description: 'Whether to automatically switch to the recommended tier',
      },
    },
    required: ['task'],
  },
};

/**
 * Handle orchestrate tool call
 */
export function handleOrchestrate(
  args: Record<string, unknown>,
  context: ServerContext
): { content: Array<{ type: 'text'; text: string }> } {
  const fmt = context.formatter;
  const task = args.task as string;
  const forceTier = args.force_tier as string | undefined;
  const autoSwitch = (args.auto_switch as boolean) ?? true;

  // Validate task input
  if (!task || typeof task !== 'string' || task.trim().length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `${fmt.error('Invalid task')}: Task must be a non-empty string`,
        },
      ],
    };
  }

  const lines: string[] = [];
  let targetTier: Tier = context.state.currentTier;
  let reason: string | undefined;

  // Check budget blocking status
  const budget = context.config.budget || { monthly_limit_usd: 100, alert_thresholds: [] };
  const usageStatus = context.costTracker.getStatus({
    monthly_limit_usd: budget.monthly_limit_usd,
    alert_thresholds: budget.alert_thresholds,
  });
  const isBlocked = usageStatus.is_blocked;

  // Define high-cost tiers that should be blocked
  const highCostTiers = ['critical', 'tier3', 'tier2'];

  // Determine target tier
  if (forceTier) {
    // Use forced tier if valid
    if (!context.ruleEngine.isValidTier(forceTier)) {
      const availableTiers = context.ruleEngine.getAvailableTiers();
      return {
        content: [
          {
            type: 'text',
            text: `${fmt.error('Invalid tier')}: "${forceTier}" for ${context.state.strategy} strategy. Available: ${availableTiers.join(', ')}`,
          },
        ],
      };
    }

    // Check if blocked from high-tier
    if (isBlocked && highCostTiers.includes(forceTier)) {
      const fallbackTier = context.state.strategy === '2-tier' ? 'primary' : 'tier1';
      lines.push(fmt.blocked('BUDGET BLOCKED'));
      lines.push(fmt.divider());
      lines.push(`Cannot use "${forceTier}" - budget limit reached (${usageStatus.percent_used.toFixed(1)}%)`);
      lines.push(`Falling back to: ${fallbackTier}`);
      lines.push('');
      targetTier = fallbackTier as Tier;
      reason = 'budget limit - forced fallback';
    } else {
      targetTier = forceTier as Tier;
      reason = 'forced by user';
      lines.push(`${fmt.icon('target')} Forced tier: ${targetTier}`);
    }
  } else {
    // Auto-classify the task
    lines.push(fmt.header('Task Classification'));
    lines.push(fmt.divider());
    lines.push(`Task: "${task.slice(0, TASK_SUMMARY_MAX_LENGTH)}${task.length > TASK_SUMMARY_MAX_LENGTH ? '...' : ''}"`);
    lines.push('');

    // Check rule engine (now includes memory-based learning)
    const ruleMatch = context.ruleEngine.classifyTask(task, context.state.currentTier);
    if (ruleMatch) {
      lines.push(`${fmt.icon('search')} Rule Match:`);
      lines.push(`   Rule: ${ruleMatch.rule_name}`);
      if (ruleMatch.matched_pattern) {
        lines.push(`   Pattern: "${ruleMatch.matched_pattern}"`);
      }
      lines.push(`   Reason: ${ruleMatch.reason}`);
      lines.push(`   Target: ${ruleMatch.target_tier}`);

      // Apply budget blocking to rule recommendation
      if (isBlocked && highCostTiers.includes(ruleMatch.target_tier)) {
        const fallbackTier = context.state.strategy === '2-tier' ? 'primary' : 'tier1';
        lines.push('');
        lines.push(`   ${fmt.icon('blocked')} Budget blocked: "${ruleMatch.target_tier}" unavailable`);
        lines.push(`   Falling back to: ${fallbackTier}`);
        targetTier = fallbackTier as Tier;
        reason = `${ruleMatch.reason} (budget blocked)`;
      } else {
        targetTier = ruleMatch.target_tier as Tier;
        reason = ruleMatch.reason;
      }
    } else {
      lines.push(`${fmt.icon('search')} No match, using current tier: ${context.state.currentTier}`);
      reason = 'no rule match';
    }
  }

  lines.push('');

  // Switch tier if needed
  const tierChanged = targetTier !== context.state.currentTier;
  if (tierChanged && autoSwitch && context.state.autoMode) {
    switchTier(context, targetTier, reason);
    lines.push(`${fmt.success('Switched to tier')}: ${targetTier}`);

    // Record in memory
    context.memoryTracker.recordTask(task, targetTier, true, { reason });
  } else if (tierChanged && !context.state.autoMode) {
    lines.push(`${fmt.info(`Recommended tier: ${targetTier}`)} (auto mode disabled, not switching)`);
  } else if (tierChanged && !autoSwitch) {
    lines.push(`${fmt.info(`Recommended tier: ${targetTier}`)} (auto_switch=false, not switching)`);
  } else {
    lines.push(`${fmt.success('Staying on tier')}: ${targetTier}`);
  }

  // Get current model info
  try {
    const modelInfo = getCurrentModel(context);
    lines.push('');
    lines.push(`${fmt.icon('pin')} Active Configuration`);
    lines.push(fmt.divider());
    lines.push(`Provider: ${modelInfo.provider}`);
    lines.push(`Model:    ${modelInfo.model}`);
    lines.push(`Model ID: ${modelInfo.modelId}`);
  } catch (error) {
    lines.push('');
    lines.push(fmt.warning('Could not get model info'));
  }

  return {
    content: [
      {
        type: 'text',
        text: lines.join('\n'),
      },
    ],
  };
}
