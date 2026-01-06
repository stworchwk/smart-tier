import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { ProvidersYamlSchema, RulesYamlSchema, MergedConfigSchema, type MergedConfig } from './schema.js';

/**
 * Load and merge YAML configuration files
 */
export async function loadConfig(configPath: string): Promise<MergedConfig> {
  const providersPath = join(configPath, 'providers.yaml');
  const rulesPath = join(configPath, 'rules.yaml');

  // Load providers.yaml (required)
  if (!existsSync(providersPath)) {
    throw new Error(`Required config file not found: ${providersPath}`);
  }

  const providersYaml = readFileSync(providersPath, 'utf-8');
  const providersRaw = parseYaml(providersYaml);
  const providersConfig = ProvidersYamlSchema.parse(providersRaw);

  // Load rules.yaml (optional)
  let rulesConfig = null;
  if (existsSync(rulesPath)) {
    const rulesYaml = readFileSync(rulesPath, 'utf-8');
    const rulesRaw = parseYaml(rulesYaml);
    rulesConfig = RulesYamlSchema.parse(rulesRaw);
  }

  // Merge configs
  const merged: MergedConfig = {
    providers: providersConfig.providers,
    defaults: providersConfig.defaults,
    rules: rulesConfig?.auto_upgrade_rules
      ? {
          keyword_rules: rulesConfig.auto_upgrade_rules.keyword_rules,
          error_escalation: rulesConfig.auto_upgrade_rules.error_escalation,
          cost_optimization: rulesConfig.auto_upgrade_rules.cost_optimization,
        }
      : undefined,
    budget: rulesConfig?.budget,
  };

  // Validate merged config
  return MergedConfigSchema.parse(merged);
}

/**
 * Get default configuration when no config files exist
 */
export function getDefaultConfig(): MergedConfig {
  return {
    providers: {
      anthropic: {
        api_key_env: 'ANTHROPIC_API_KEY',
        models: {
          haiku: {
            id: 'claude-3-haiku-20240307',
            input_cost_per_mtok: 0.25,
            output_cost_per_mtok: 1.25,
            max_tokens: 4096,
            context_window: 200000,
          },
          sonnet: {
            id: 'claude-sonnet-4-20250514',
            input_cost_per_mtok: 3.0,
            output_cost_per_mtok: 15.0,
            max_tokens: 8192,
            context_window: 200000,
          },
          opus: {
            id: 'claude-opus-4-5-20251101',
            input_cost_per_mtok: 15.0,
            output_cost_per_mtok: 75.0,
            max_tokens: 8192,
            context_window: 200000,
          },
        },
      },
    },
    defaults: {
      provider: 'anthropic',
      strategy: '2-tier',
      tier_models: {
        '2-tier': {
          primary: 'anthropic:sonnet',
          critical: 'anthropic:opus',
        },
        '3-tier': {
          tier1: 'anthropic:haiku',
          tier2: 'anthropic:sonnet',
          tier3: 'anthropic:opus',
        },
      },
    },
    rules: {
      keyword_rules: [
        {
          name: 'architecture_keywords',
          patterns: ['architecture', 'design decision', 'system design', 'refactor', 'restructure'],
          target_tier: { '2-tier': 'critical', '3-tier': 'tier3' },
          priority: 100,
        },
        {
          name: 'security_keywords',
          patterns: ['security', 'authentication', 'authorization', 'vulnerability', 'encryption'],
          target_tier: { '2-tier': 'critical', '3-tier': 'tier3' },
          priority: 90,
        },
        {
          name: 'exploration_keywords',
          patterns: ['explore', 'search', 'find', 'list', 'what is', 'how to'],
          target_tier: { '2-tier': 'primary', '3-tier': 'tier1' },
          priority: 50,
        },
        {
          name: 'implementation_keywords',
          patterns: ['implement', 'code', 'create', 'add', 'fix', 'debug'],
          target_tier: { '2-tier': 'primary', '3-tier': 'tier2' },
          priority: 60,
        },
      ],
      error_escalation: {
        enabled: true,
        threshold: 3,
        window_minutes: 30,
        action: 'escalate_one_tier',
      },
      cost_optimization: {
        enabled: true,
        simple_task_patterns: ['list files', 'show status', 'get info', 'read file'],
        action: 'suggest_lower_tier',
      },
    },
    budget: {
      monthly_limit_usd: 100.0,
      alert_thresholds: [
        { percent: 50, action: 'log_warning' },
        { percent: 80, action: 'notify_user' },
        { percent: 95, action: 'require_confirmation' },
        { percent: 100, action: 'block_high_tier' },
      ],
    },
  };
}

/**
 * Parse model reference string (e.g., "anthropic:sonnet")
 */
export function parseModelRef(modelRef: string): { provider: string; model: string } {
  const [provider, model] = modelRef.split(':');
  if (!provider || !model) {
    throw new Error(`Invalid model reference: ${modelRef}. Expected format: "provider:model"`);
  }
  return { provider, model };
}
