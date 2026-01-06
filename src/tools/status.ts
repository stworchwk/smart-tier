import type { ServerContext } from '../server.js';
import { getCurrentModel } from '../server.js';

export const getStatusToolDef = {
  name: 'get_status',
  description:
    'Get the current model optimizer status including active tier, model, usage statistics, and cost information.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      detailed: {
        type: 'boolean',
        default: false,
        description: 'Include detailed breakdown by tier and model',
      },
    },
  },
};

export function handleGetStatus(
  args: Record<string, unknown>,
  context: ServerContext
): { content: Array<{ type: 'text'; text: string }> } {
  const detailed = (args.detailed as boolean) ?? false;

  // Get current model info
  let modelInfo;
  try {
    modelInfo = getCurrentModel(context);
  } catch {
    modelInfo = { provider: 'unknown', model: 'unknown', modelId: 'unknown' };
  }

  // Get budget config
  const budget = context.config.budget || { monthly_limit_usd: 100, alert_thresholds: [] };

  // Get usage status with all thresholds
  const usage = context.costTracker.getStatus({
    monthly_limit_usd: budget.monthly_limit_usd,
    alert_thresholds: budget.alert_thresholds,
  });

  // Get memory summary
  const memorySummary = context.memoryTracker.getSessionSummary();

  // Build status message
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════');
  lines.push('       MODEL OPTIMIZER STATUS');
  lines.push('═══════════════════════════════════════');
  lines.push('');

  // Current configuration
  lines.push('📊 CURRENT CONFIGURATION');
  lines.push('───────────────────────────────────────');
  lines.push(`Strategy:    ${context.state.strategy}`);
  lines.push(`Current Tier: ${context.state.currentTier}`);
  lines.push(`Auto Mode:   ${context.state.autoMode ? '✓ Enabled' : '✗ Disabled'}`);
  lines.push(`Provider:    ${modelInfo.provider}`);
  lines.push(`Model:       ${modelInfo.model} (${modelInfo.modelId})`);
  lines.push('');

  // Budget and usage
  lines.push('💰 BUDGET & USAGE');
  lines.push('───────────────────────────────────────');
  lines.push(`Month:       ${usage.current_month}`);
  lines.push(`Spent:       $${usage.spent_usd.toFixed(2)} / $${usage.budget_usd.toFixed(2)}`);
  lines.push(`Usage:       ${usage.percent_used.toFixed(1)}%`);
  lines.push(`Remaining:   $${usage.remaining_usd.toFixed(2)}`);

  // Show triggered alerts
  if (usage.triggered_alerts.length > 0) {
    lines.push('');
    for (const alert of usage.triggered_alerts) {
      const icon = alert.action === 'block_high_tier' ? '🚫' :
                   alert.action === 'require_confirmation' ? '⛔' :
                   alert.action === 'notify_user' ? '⚠️' : 'ℹ️';
      lines.push(`${icon}  ${alert.percent}% threshold: ${alert.action.replace(/_/g, ' ')}`);
    }
  }

  // Show blocking status
  if (usage.is_blocked) {
    lines.push('');
    lines.push('🚫 HIGH-TIER BLOCKED: Budget limit reached!');
    lines.push('   Only primary/tier1 models available.');
  }

  // Detailed breakdown
  if (detailed) {
    lines.push('');
    lines.push('📈 USAGE BY TIER');
    lines.push('───────────────────────────────────────');
    if (Object.keys(usage.by_tier).length === 0) {
      lines.push('No usage recorded yet');
    } else {
      for (const [tier, data] of Object.entries(usage.by_tier)) {
        lines.push(`${tier.padEnd(12)} $${data.cost.toFixed(4)} (${data.tokens.toLocaleString()} tokens)`);
      }
    }

    lines.push('');
    lines.push('📈 USAGE BY MODEL');
    lines.push('───────────────────────────────────────');
    if (Object.keys(usage.by_model).length === 0) {
      lines.push('No usage recorded yet');
    } else {
      for (const [model, data] of Object.entries(usage.by_model)) {
        lines.push(`${model.padEnd(20)} $${data.cost.toFixed(4)} (${data.tokens.toLocaleString()} tokens)`);
      }
    }

    // Memory patterns
    if (memorySummary) {
      lines.push('');
      lines.push('🧠 SESSION MEMORY');
      lines.push('───────────────────────────────────────');
      lines.push(`Session:      ${memorySummary.session_id.slice(0, 8)}...`);
      lines.push(`Entries:      ${memorySummary.entry_count}`);
      lines.push(`Success Rate: ${memorySummary.success_rate}%`);

      if (Object.keys(memorySummary.patterns).length > 0) {
        lines.push('');
        lines.push('Task Patterns:');
        for (const [pattern, count] of Object.entries(memorySummary.patterns)) {
          lines.push(`  ${pattern}: ${count}`);
        }
      }
    }
  }

  // Available tiers
  lines.push('');
  lines.push('🎚️ AVAILABLE TIERS');
  lines.push('───────────────────────────────────────');
  const tierModels = context.config.defaults.tier_models[context.state.strategy];
  for (const [tier, modelRef] of Object.entries(tierModels)) {
    const isCurrent = tier === context.state.currentTier;
    lines.push(`${isCurrent ? '→' : ' '} ${tier.padEnd(10)} ${modelRef}`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════');

  return {
    content: [
      {
        type: 'text',
        text: lines.join('\n'),
      },
    ],
  };
}
