/**
 * Custom error types for Model Optimizer
 */

/**
 * Base error class for all Model Optimizer errors
 */
export class ModelOptimizerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelOptimizerError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigError extends ModelOptimizerError {
  constructor(message: string, public readonly configPath?: string) {
    super(`Configuration error: ${message}`);
    this.name = 'ConfigError';
  }
}

/**
 * Error thrown when a provider or model is not found
 */
export class ProviderError extends ModelOptimizerError {
  constructor(message: string, public readonly provider?: string) {
    super(`Provider error: ${message}`);
    this.name = 'ProviderError';
  }
}

/**
 * Error thrown when model reference is invalid
 */
export class ModelNotFoundError extends ProviderError {
  constructor(modelRef: string) {
    super(`Model not found: ${modelRef}`);
    this.name = 'ModelNotFoundError';
  }
}

/**
 * Error thrown when tier is invalid for current strategy
 */
export class InvalidTierError extends ModelOptimizerError {
  constructor(tier: string, strategy: string) {
    super(`Invalid tier "${tier}" for strategy "${strategy}"`);
    this.name = 'InvalidTierError';
  }
}

/**
 * Error thrown when budget limit is exceeded
 */
export class BudgetExceededError extends ModelOptimizerError {
  constructor(
    message: string,
    public readonly spentUsd: number,
    public readonly budgetUsd: number
  ) {
    super(`Budget exceeded: ${message}`);
    this.name = 'BudgetExceededError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends ModelOptimizerError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(`Validation error: ${message}`);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when file operations fail
 */
export class FileOperationError extends ModelOptimizerError {
  constructor(
    message: string,
    public readonly filePath?: string,
    public readonly operation?: string
  ) {
    super(`File operation error: ${message}`);
    this.name = 'FileOperationError';
  }
}
