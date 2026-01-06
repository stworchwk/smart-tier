import { z } from 'zod';

// ============================================================================
// YAML Config File Schemas
// ============================================================================

// providers.yaml schema
export const ProvidersYamlSchema = z.object({
  providers: z.record(
    z.string(),
    z.object({
      base_url: z.string().optional(),
      api_key_env: z.string(),
      models: z.record(
        z.string(),
        z.object({
          id: z.string(),
          input_cost_per_mtok: z.number(),
          output_cost_per_mtok: z.number(),
          max_tokens: z.number(),
          context_window: z.number(),
        })
      ),
    })
  ),
  defaults: z.object({
    provider: z.string(),
    strategy: z.enum(['2-tier', '3-tier']),
    tier_models: z.object({
      '2-tier': z.object({
        primary: z.string(),
        critical: z.string(),
      }),
      '3-tier': z.object({
        tier1: z.string(),
        tier2: z.string(),
        tier3: z.string(),
      }),
    }),
  }),
});

// strategies.yaml schema
export const StrategiesYamlSchema = z.object({
  strategies: z.record(
    z.string(),
    z.object({
      name: z.string(),
      description: z.string(),
      tiers: z.record(
        z.string(),
        z.object({
          description: z.string(),
          escalation_to: z.string().nullable(),
        })
      ),
      commands: z.array(
        z.object({
          name: z.string(),
          tier: z.string(),
          description: z.string(),
        })
      ),
    })
  ),
});

// Cost optimization schema
export const CostOptimizationSchema = z.object({
  enabled: z.boolean(),
  simple_task_patterns: z.array(z.string()),
  action: z.string(),
});

// rules.yaml schema
export const RulesYamlSchema = z.object({
  auto_upgrade_rules: z.object({
    keyword_rules: z.array(
      z.object({
        name: z.string(),
        patterns: z.array(z.string()),
        target_tier: z.record(z.string(), z.string()),
        priority: z.number(),
      })
    ),
    error_escalation: z.object({
      enabled: z.boolean(),
      threshold: z.number(),
      window_minutes: z.number(),
      action: z.string(),
    }),
    cost_optimization: CostOptimizationSchema.optional(),
  }),
  budget: z
    .object({
      monthly_limit_usd: z.number(),
      alert_thresholds: z.array(
        z.object({
          percent: z.number(),
          action: z.string(),
        })
      ),
    })
    .optional(),
});

// ============================================================================
// Merged Config Schema
// ============================================================================

export const MergedConfigSchema = z.object({
  providers: ProvidersYamlSchema.shape.providers,
  defaults: ProvidersYamlSchema.shape.defaults,
  strategies: StrategiesYamlSchema.shape.strategies.optional(),
  rules: z
    .object({
      keyword_rules: z.array(
        z.object({
          name: z.string(),
          patterns: z.array(z.string()),
          target_tier: z.record(z.string(), z.string()),
          priority: z.number(),
        })
      ),
      error_escalation: z.object({
        enabled: z.boolean(),
        threshold: z.number(),
        window_minutes: z.number(),
        action: z.string(),
      }),
      cost_optimization: CostOptimizationSchema.optional(),
    })
    .optional(),
  budget: z
    .object({
      monthly_limit_usd: z.number(),
      alert_thresholds: z.array(
        z.object({
          percent: z.number(),
          action: z.string(),
        })
      ),
    })
    .optional(),
});

export type MergedConfig = z.infer<typeof MergedConfigSchema>;
