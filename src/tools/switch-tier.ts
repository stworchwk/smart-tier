import type { ServerContext } from '../server.js';
import type { Tier } from '../types/index.js';
import { switchTier } from '../server.js';

export const switchTierToolDef = {
  name: 'switch_tier',
  description:
    'Switch to a specific model tier. For 2-tier strategy: primary, critical. For 3-tier strategy: tier1, tier2, tier3.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      tier: {
        type: 'string',
        enum: ['primary', 'critical', 'tier1', 'tier2', 'tier3'],
        description: 'The tier to switch to',
      },
      reason: {
        type: 'string',
        description: 'Optional reason for the switch',
      },
    },
    required: ['tier'],
  },
};

export function handleSwitchTier(
  args: Record<string, unknown>,
  context: ServerContext
): { content: Array<{ type: 'text'; text: string }> } {
  const tier = args.tier as string;
  const reason = args.reason as string | undefined;

  // Validate tier for current strategy
  if (!context.ruleEngine.isValidTier(tier)) {
    const availableTiers = context.ruleEngine.getAvailableTiers();
    return {
      content: [
        {
          type: 'text',
          text: `Invalid tier "${tier}" for ${context.state.strategy} strategy. Available tiers: ${availableTiers.join(', ')}`,
        },
      ],
    };
  }

  const previousTier = context.state.currentTier;
  switchTier(context, tier as Tier, reason);

  // Get the model for the new tier
  const tierModels = context.config.defaults.tier_models[context.state.strategy];
  const modelRef = tierModels[tier as keyof typeof tierModels];

  return {
    content: [
      {
        type: 'text',
        text: `Switched from ${previousTier} to ${tier}${reason ? ` (${reason})` : ''}.\nActive model: ${modelRef}`,
      },
    ],
  };
}
