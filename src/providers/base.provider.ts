import type { CompleteParams, ModelResponse, ProviderConfig, ModelConfig } from '../types/index.js';

/**
 * Abstract base class for AI model providers
 */
export abstract class BaseProvider {
  protected name: string;
  protected config: ProviderConfig;
  protected apiKey: string;

  constructor(name: string, config: ProviderConfig) {
    this.name = name;
    this.config = config;

    // Get API key from environment
    const apiKey = process.env[config.api_key_env];
    if (!apiKey) {
      throw new Error(`API key not found in environment variable: ${config.api_key_env}`);
    }
    this.apiKey = apiKey;
  }

  /**
   * Complete a chat conversation
   */
  abstract complete(params: CompleteParams): Promise<ModelResponse>;

  /**
   * Get the provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get model configuration by name
   */
  getModelConfig(modelName: string): ModelConfig | undefined {
    return this.config.models[modelName];
  }

  /**
   * Get all available models
   */
  getAvailableModels(): string[] {
    return Object.keys(this.config.models);
  }

  /**
   * Calculate cost for a request
   */
  calculateCost(modelName: string, inputTokens: number, outputTokens: number): number {
    const model = this.getModelConfig(modelName);
    if (!model) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const inputCost = (inputTokens / 1_000_000) * model.input_cost_per_mtok;
    const outputCost = (outputTokens / 1_000_000) * model.output_cost_per_mtok;
    return inputCost + outputCost;
  }

  /**
   * Check if a model is available
   */
  hasModel(modelName: string): boolean {
    return modelName in this.config.models;
  }
}
