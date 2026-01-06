import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { UsageRecord, UsageData, MonthlyUsage } from '../types/index.js';
import { FileOperationError } from '../errors/index.js';

/**
 * Cost and usage tracker with persistence
 */
export class CostTracker {
  private dataPath: string;
  private data: UsageData;

  constructor(dataDir: string) {
    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      try {
        mkdirSync(dataDir, { recursive: true });
      } catch (error) {
        throw new FileOperationError(
          `Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`,
          dataDir,
          'create'
        );
      }
    }

    this.dataPath = join(dataDir, 'usage.json');
    this.data = this.load();
  }

  /**
   * Load usage data from file
   * @throws {FileOperationError} If file cannot be read or parsed
   */
  private load(): UsageData {
    if (existsSync(this.dataPath)) {
      try {
        const raw = readFileSync(this.dataPath, 'utf-8');
        const parsed = JSON.parse(raw) as UsageData;
        // Validate basic structure
        if (!parsed.records || !Array.isArray(parsed.records)) {
          throw new FileOperationError('Invalid usage data: missing or invalid records array', this.dataPath, 'read');
        }
        if (!parsed.monthly_totals || typeof parsed.monthly_totals !== 'object') {
          throw new FileOperationError('Invalid usage data: missing or invalid monthly_totals', this.dataPath, 'read');
        }
        return parsed;
      } catch (error) {
        if (error instanceof FileOperationError) {
          throw error;
        }
        throw new FileOperationError(
          `Failed to load usage data: ${error instanceof Error ? error.message : String(error)}`,
          this.dataPath,
          'read'
        );
      }
    }
    return { records: [], monthly_totals: {} };
  }

  /**
   * Save usage data to file
   * @throws {FileOperationError} If file cannot be written
   */
  private save(): void {
    try {
      const dir = dirname(this.dataPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      throw new FileOperationError(
        `Failed to save usage data: ${error instanceof Error ? error.message : String(error)}`,
        this.dataPath,
        'write'
      );
    }
  }

  /**
   * Get the current month key (YYYY-MM)
   * @param date - The date to get the month key for (defaults to current date)
   * @returns The month key in YYYY-MM format
   */
  private getMonthKey(date: Date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Record a usage event
   * @param params - The usage event parameters
   * @param params.provider - The provider name (e.g., 'anthropic', 'zhipu')
   * @param params.model - The model name (e.g., 'sonnet', 'opus')
   * @param params.tier - The tier used (e.g., 'primary', 'critical', 'tier1')
   * @param params.input_tokens - Number of input tokens used
   * @param params.output_tokens - Number of output tokens used
   * @param params.cost_usd - Cost in USD for this request
   * @param params.task_summary - Optional description of the task
   * @throws {FileOperationError} If saving the data fails
   */
  record(params: {
    provider: string;
    model: string;
    tier: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    task_summary?: string;
  }): void {
    const record: UsageRecord = {
      timestamp: new Date().toISOString(),
      ...params,
    };

    this.data.records.push(record);

    // Update monthly totals
    const monthKey = this.getMonthKey();
    if (!this.data.monthly_totals[monthKey]) {
      this.data.monthly_totals[monthKey] = {
        total_cost: 0,
        total_tokens: 0,
        by_tier: {},
        by_model: {},
      };
    }

    const monthly = this.data.monthly_totals[monthKey];
    monthly.total_cost += params.cost_usd;
    monthly.total_tokens += params.input_tokens + params.output_tokens;

    // By tier
    if (!monthly.by_tier[params.tier]) {
      monthly.by_tier[params.tier] = { cost: 0, tokens: 0 };
    }
    monthly.by_tier[params.tier].cost += params.cost_usd;
    monthly.by_tier[params.tier].tokens += params.input_tokens + params.output_tokens;

    // By model
    const modelKey = `${params.provider}:${params.model}`;
    if (!monthly.by_model[modelKey]) {
      monthly.by_model[modelKey] = { cost: 0, tokens: 0 };
    }
    monthly.by_model[modelKey].cost += params.cost_usd;
    monthly.by_model[modelKey].tokens += params.input_tokens + params.output_tokens;

    this.save();
  }

  /**
   * Get monthly usage data
   * @param monthKey - The month key in YYYY-MM format (defaults to current month)
   * @returns The monthly usage data, or null if no data exists for the month
   */
  getMonthlyUsage(monthKey?: string): MonthlyUsage | null {
    const key = monthKey || this.getMonthKey();
    return this.data.monthly_totals[key] || null;
  }

  /**
   * Get current usage status with budget information and alert thresholds
   * @param budget - The budget configuration
   * @param budget.monthly_limit_usd - Monthly budget limit in USD
   * @param budget.alert_thresholds - Array of alert thresholds with actions
   * @returns Status object containing usage statistics and budget information
   */
  getStatus(budget: {
    monthly_limit_usd: number;
    alert_thresholds?: Array<{ percent: number; action: string }>;
  }): {
    current_month: string;
    spent_usd: number;
    budget_usd: number;
    percent_used: number;
    remaining_usd: number;
    alert_triggered: boolean;
    triggered_alerts: Array<{ percent: number; action: string }>;
    is_blocked: boolean;
    by_tier: Record<string, { cost: number; tokens: number }>;
    by_model: Record<string, { cost: number; tokens: number }>;
  } {
    const monthKey = this.getMonthKey();
    const monthly = this.getMonthlyUsage(monthKey);
    const spent = monthly?.total_cost || 0;
    const percentUsed = budget.monthly_limit_usd > 0
      ? (spent / budget.monthly_limit_usd) * 100
      : 0;

    // Check all thresholds
    const thresholds = budget.alert_thresholds || [{ percent: 80, action: 'notify_user' }];
    const triggeredAlerts = thresholds
      .filter((t) => percentUsed >= t.percent)
      .sort((a, b) => b.percent - a.percent);

    // Check if blocked (100% threshold with block action)
    const isBlocked = triggeredAlerts.some(
      (t) => t.action === 'block_high_tier' && percentUsed >= t.percent
    );

    return {
      current_month: monthKey,
      spent_usd: Math.round(spent * 100) / 100,
      budget_usd: budget.monthly_limit_usd,
      percent_used: Math.round(percentUsed * 10) / 10,
      remaining_usd: Math.round((budget.monthly_limit_usd - spent) * 100) / 100,
      alert_triggered: triggeredAlerts.length > 0,
      triggered_alerts: triggeredAlerts,
      is_blocked: isBlocked,
      by_tier: monthly?.by_tier || {},
      by_model: monthly?.by_model || {},
    };
  }

  /**
   * Get recent usage records
   * @param limit - Maximum number of records to return (default: 10)
   * @returns Array of recent usage records
   */
  getRecentRecords(limit: number = 10): UsageRecord[] {
    return this.data.records.slice(-limit);
  }

  /**
   * Get total spend across all recorded months
   * @returns Total cost in USD
   */
  getTotalSpend(): number {
    return Object.values(this.data.monthly_totals).reduce(
      (sum, month) => sum + month.total_cost,
      0
    );
  }

  /**
   * Clear all tracked data (useful for testing)
   * @throws {FileOperationError} If saving the empty data fails
   */
  clear(): void {
    this.data = { records: [], monthly_totals: {} };
    this.save();
  }
}
