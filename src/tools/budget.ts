import type { ServerContext } from '../server.js';

export const setBudgetToolDef = {
  name: 'set_budget',
  description:
    'Configure the monthly budget limit and alert thresholds for model usage.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      monthly_limit_usd: {
        type: 'number',
        description: 'Monthly budget limit in USD',
      },
      alert_threshold_percent: {
        type: 'number',
        default: 80,
        description: 'Percentage at which to trigger alert (default: 80). This adds a notify_user action threshold.',
      },
    },
    required: ['monthly_limit_usd'],
  },
};

export function handleSetBudget(
  args: Record<string, unknown>,
  context: ServerContext
): { content: Array<{ type: 'text'; text: string }> } {
  const monthlyLimit = args.monthly_limit_usd as number;
  const alertThresholdPercent = (args.alert_threshold_percent as number) ?? 80;

  // Validate inputs
  if (monthlyLimit <= 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: monthly_limit_usd must be greater than 0',
        },
      ],
    };
  }

  if (alertThresholdPercent < 0 || alertThresholdPercent > 100) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: alert_threshold_percent must be between 0 and 100',
        },
      ],
    };
  }

  // Update budget config
  if (!context.config.budget) {
    context.config.budget = {
      monthly_limit_usd: monthlyLimit,
      alert_thresholds: [],
    };
  } else {
    context.config.budget.monthly_limit_usd = monthlyLimit;
  }

  // Build alert thresholds array with default thresholds plus custom one
  const defaultThresholds = [
    { percent: 50, action: 'log_warning' },
    { percent: 95, action: 'require_confirmation' },
    { percent: 100, action: 'block_high_tier' },
  ];
  // Add the custom alert threshold if not already present
  const customThreshold = { percent: alertThresholdPercent, action: 'notify_user' };
  const hasCustomThreshold = defaultThresholds.some(t => t.percent === alertThresholdPercent);
  const alertThresholds = hasCustomThreshold
    ? defaultThresholds
    : [...defaultThresholds, customThreshold].sort((a, b) => a.percent - b.percent);

  // Get current usage status with new budget
  const usage = context.costTracker.getStatus({
    monthly_limit_usd: monthlyLimit,
    alert_thresholds: alertThresholds,
  });

  const lines: string[] = [];
  lines.push('Budget Configuration Updated');
  lines.push('───────────────────────────────────────');
  lines.push(`Monthly Limit: $${monthlyLimit.toFixed(2)}`);
  lines.push(`Alert Thresholds:`);
  for (const t of alertThresholds) {
    lines.push(`  - ${t.percent}%: ${t.action}`);
  }
  lines.push('');
  lines.push('Current Usage');
  lines.push('───────────────────────────────────────');
  lines.push(`Spent:         $${usage.spent_usd.toFixed(2)}`);
  lines.push(`Remaining:     $${usage.remaining_usd.toFixed(2)}`);
  lines.push(`Usage:         ${usage.percent_used.toFixed(1)}%`);

  if (usage.alert_triggered) {
    lines.push('');
    lines.push(`WARNING: Current usage exceeds alert threshold(s)!`);
    for (const t of usage.triggered_alerts) {
      lines.push(`  - ${t.percent}%: ${t.action}`);
    }
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
