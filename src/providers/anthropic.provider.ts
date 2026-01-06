import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.provider.js';
import type { CompleteParams, ModelResponse, ProviderConfig } from '../types/index.js';

/**
 * Anthropic Claude API provider
 */
export class AnthropicProvider extends BaseProvider {
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    super('anthropic', config);
    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  async complete(params: CompleteParams): Promise<ModelResponse> {
    const modelConfig = this.getModelConfig(params.model);
    if (!modelConfig) {
      throw new Error(`Unknown Anthropic model: ${params.model}`);
    }

    // Convert messages to Anthropic format
    const messages = params.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      const response = await this.client.messages.create({
        model: modelConfig.id,
        max_tokens: params.max_tokens || modelConfig.max_tokens,
        messages,
        system: params.system,
        temperature: params.temperature,
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text');
      const content = textContent?.type === 'text' ? textContent.text : '';

      return {
        content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: params.model,
        stop_reason: response.stop_reason || undefined,
      };
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw error;
    }
  }
}
