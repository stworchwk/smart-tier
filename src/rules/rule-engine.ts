import type { RuleMatch, StrategyType, Tier } from '../types/index.js';

interface KeywordRule {
  name: string;
  patterns: string[];
  target_tier: Record<string, string>;
  priority: number;
}

interface ErrorEscalation {
  enabled: boolean;
  threshold: number;
  window_minutes: number;
  action: string;
}

interface CostOptimization {
  enabled: boolean;
  simple_task_patterns: string[];
  action: string;
}

interface RulesConfig {
  keyword_rules: KeywordRule[];
  error_escalation: ErrorEscalation;
  cost_optimization?: CostOptimization;
}

/**
 * Interface for memory tracker that provides tier recommendations
 */
export interface IMemoryTracker {
  getRecommendedTier(task: string): string | null;
}

/**
 * Rule engine for automatic tier selection
 */
export class RuleEngine {
  private config: RulesConfig | undefined;
  private strategy: StrategyType;
  private errorWindow: Date[] = [];
  private memoryTracker?: IMemoryTracker;

  constructor(
    config: RulesConfig | undefined,
    strategy: StrategyType = '2-tier',
    memoryTracker?: IMemoryTracker
  ) {
    this.config = config;
    this.strategy = strategy;
    this.memoryTracker = memoryTracker;
  }

  /**
   * Set the current strategy
   */
  setStrategy(strategy: StrategyType): void {
    this.strategy = strategy;
  }

  /**
   * Get the current strategy
   */
  getStrategy(): StrategyType {
    return this.strategy;
  }

  /**
   * Record an error for escalation tracking
   */
  recordError(): void {
    if (!this.config?.error_escalation.enabled) return;

    const now = new Date();
    this.errorWindow.push(now);
    this.cleanErrorWindow();
  }

  /**
   * Reset error count
   */
  resetErrors(): void {
    this.errorWindow = [];
  }

  /**
   * Get current error count
   */
  getErrorCount(): number {
    this.cleanErrorWindow();
    return this.errorWindow.length;
  }

  /**
   * Clean old errors from the window
   */
  private cleanErrorWindow(): void {
    if (!this.config?.error_escalation) return;

    const now = new Date();
    const windowMs = this.config.error_escalation.window_minutes * 60 * 1000;
    const cutoff = new Date(now.getTime() - windowMs);
    this.errorWindow = this.errorWindow.filter((d) => d > cutoff);
  }

  /**
   * Set the memory tracker for learning-based recommendations
   */
  setMemoryTracker(memoryTracker: IMemoryTracker): void {
    this.memoryTracker = memoryTracker;
  }

  /**
   * Classify a task and return the recommended tier
   */
  classifyTask(task: string, currentTier: Tier): RuleMatch | null {
    if (!this.config) return null;

    const taskLower = task.toLowerCase();
    const matches: RuleMatch[] = [];

    // Check keyword rules
    for (const rule of this.config.keyword_rules) {
      for (const pattern of rule.patterns) {
        if (taskLower.includes(pattern.toLowerCase())) {
          const targetTier = rule.target_tier[this.strategy];
          if (targetTier) {
            matches.push({
              rule_name: rule.name,
              matched_pattern: pattern,
              target_tier: targetTier,
              priority: rule.priority,
              reason: `Matched pattern "${pattern}" in ${rule.name}`,
            });
          }
          break; // Only match first pattern per rule
        }
      }
    }

    // Check error escalation
    if (this.config.error_escalation.enabled) {
      this.cleanErrorWindow();
      if (this.errorWindow.length >= this.config.error_escalation.threshold) {
        const escalatedTier = this.getEscalatedTier(currentTier);
        if (escalatedTier) {
          matches.push({
            rule_name: 'error_escalation',
            target_tier: escalatedTier,
            priority: 200, // High priority for errors
            reason: `${this.errorWindow.length} errors in last ${this.config.error_escalation.window_minutes} minutes`,
          });
        }
      }
    }

    // Check cost optimization (suggest lower tier for simple tasks)
    if (this.config.cost_optimization?.enabled && matches.length === 0) {
      for (const pattern of this.config.cost_optimization.simple_task_patterns) {
        if (taskLower.includes(pattern.toLowerCase())) {
          const lowestTier = this.strategy === '2-tier' ? 'primary' : 'tier1';
          matches.push({
            rule_name: 'cost_optimization',
            matched_pattern: pattern,
            target_tier: lowestTier,
            priority: 10, // Low priority - only if no other match
            reason: `Simple task detected - using lowest cost tier`,
          });
          break;
        }
      }
    }

    // Check memory-based learning if no other matches
    if (matches.length === 0 && this.memoryTracker) {
      const memoryRecommendation = this.memoryTracker.getRecommendedTier(task);
      if (memoryRecommendation && this.isValidTier(memoryRecommendation)) {
        matches.push({
          rule_name: 'memory_based',
          target_tier: memoryRecommendation,
          priority: 30, // Low-medium priority - used when no explicit rules match
          reason: 'Based on previous similar tasks',
        });
      }
    }

    // Return highest priority match
    if (matches.length === 0) return null;
    matches.sort((a, b) => b.priority - a.priority);
    return matches[0];
  }

  /**
   * Get the next tier up for escalation
   */
  private getEscalatedTier(currentTier: Tier): string | null {
    const escalationMap: Record<string, Record<string, string | null>> = {
      '2-tier': {
        primary: 'critical',
        critical: null,
      },
      '3-tier': {
        tier1: 'tier2',
        tier2: 'tier3',
        tier3: null,
      },
    };
    return escalationMap[this.strategy]?.[currentTier] || null;
  }

  /**
   * Get available tiers for current strategy
   */
  getAvailableTiers(): Tier[] {
    if (this.strategy === '2-tier') {
      return ['primary', 'critical'];
    }
    return ['tier1', 'tier2', 'tier3'];
  }

  /**
   * Validate if a tier is valid for current strategy
   */
  isValidTier(tier: string): boolean {
    const validTiers = this.getAvailableTiers();
    return validTiers.includes(tier as Tier);
  }

  /**
   * Get default tier for current strategy
   */
  getDefaultTier(): Tier {
    return this.strategy === '2-tier' ? 'primary' : 'tier1';
  }
}
