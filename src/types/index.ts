import { z } from 'zod';

// ============================================================================
// Model and Provider Types
// ============================================================================

export const ModelConfigSchema = z.object({
  id: z.string(),
  input_cost_per_mtok: z.number(),
  output_cost_per_mtok: z.number(),
  max_tokens: z.number(),
  context_window: z.number(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

export const ProviderConfigSchema = z.object({
  base_url: z.string().optional(),
  api_key_env: z.string(),
  models: z.record(z.string(), ModelConfigSchema),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// ============================================================================
// Strategy Types
// ============================================================================

export const TierSchema = z.enum(['primary', 'critical', 'tier1', 'tier2', 'tier3']);
export type Tier = z.infer<typeof TierSchema>;

export const StrategyTypeSchema = z.enum(['2-tier', '3-tier']);
export type StrategyType = z.infer<typeof StrategyTypeSchema>;

export const TierMappingSchema = z.object({
  '2-tier': z.object({
    primary: z.string(),
    critical: z.string(),
  }),
  '3-tier': z.object({
    tier1: z.string(),
    tier2: z.string(),
    tier3: z.string(),
  }),
});

export type TierMapping = z.infer<typeof TierMappingSchema>;

// ============================================================================
// Rule Types
// ============================================================================

export const KeywordRuleSchema = z.object({
  name: z.string(),
  patterns: z.array(z.string()),
  target_tier: z.record(z.string(), z.string()),
  priority: z.number(),
});

export type KeywordRule = z.infer<typeof KeywordRuleSchema>;

export const ErrorEscalationSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number(),
  window_minutes: z.number(),
  action: z.string(),
});

export type ErrorEscalation = z.infer<typeof ErrorEscalationSchema>;

export const RulesConfigSchema = z.object({
  keyword_rules: z.array(KeywordRuleSchema),
  error_escalation: ErrorEscalationSchema,
});

export type RulesConfig = z.infer<typeof RulesConfigSchema>;

// ============================================================================
// Budget Types
// ============================================================================

export const BudgetConfigSchema = z.object({
  monthly_limit_usd: z.number(),
  alert_thresholds: z.array(
    z.object({
      percent: z.number(),
      action: z.string(),
    })
  ),
});

export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;

// ============================================================================
// Configuration Types
// ============================================================================

export const ConfigSchema = z.object({
  providers: z.record(z.string(), ProviderConfigSchema),
  defaults: z.object({
    provider: z.string(),
    strategy: StrategyTypeSchema,
    tier_models: TierMappingSchema,
  }),
  rules: RulesConfigSchema.optional(),
  budget: BudgetConfigSchema.optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CompleteParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  system?: string;
}

export interface ModelResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model: string;
  stop_reason?: string;
}

// ============================================================================
// Usage Tracking Types
// ============================================================================

export interface UsageRecord {
  timestamp: string;
  provider: string;
  model: string;
  tier: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  task_summary?: string;
}

export interface MonthlyUsage {
  total_cost: number;
  total_tokens: number;
  by_tier: Record<string, { cost: number; tokens: number }>;
  by_model: Record<string, { cost: number; tokens: number }>;
}

export interface UsageData {
  records: UsageRecord[];
  monthly_totals: Record<string, MonthlyUsage>;
}

// ============================================================================
// Memory Types
// ============================================================================

export interface MemoryEntry {
  timestamp: string;
  task_pattern: string;
  tier_used: string;
  success: boolean;
  context?: Record<string, unknown>;
}

export interface ConversationMemory {
  session_id: string;
  entries: MemoryEntry[];
  created_at: string;
  last_updated: string;
}

// ============================================================================
// Rule Match Types
// ============================================================================

export interface RuleMatch {
  rule_name: string;
  matched_pattern?: string;
  target_tier: string;
  priority: number;
  reason: string;
}

// ============================================================================
// Status Types
// ============================================================================

export interface StatusInfo {
  current_tier: Tier;
  current_model: string;
  current_provider: string;
  strategy: StrategyType;
  auto_mode: boolean;
  usage: {
    current_month: string;
    spent_usd: number;
    budget_usd: number;
    percent_used: number;
    remaining_usd: number;
    alert_triggered: boolean;
  };
}

// ============================================================================
// Server State
// ============================================================================

export interface ServerState {
  currentTier: Tier;
  strategy: StrategyType;
  autoMode: boolean;
  useEmojis: boolean;
}
