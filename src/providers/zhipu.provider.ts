import { BaseProvider } from './base.provider.js';
import type { CompleteParams, ModelResponse, ProviderConfig } from '../types/index.js';

/**
 * ZhipuAI GLM API provider
 */
export class ZhipuProvider extends BaseProvider {
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    super('zhipu', config);
    this.baseUrl = config.base_url || 'https://open.bigmodel.cn/api/paas/v4';
  }

  async complete(params: CompleteParams): Promise<ModelResponse> {
    const modelConfig = this.getModelConfig(params.model);
    if (!modelConfig) {
      throw new Error(`Unknown ZhipuAI model: ${params.model}`);
    }

    // Build messages array
    const messages = params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add system message if provided
    if (params.system) {
      messages.unshift({
        role: 'system',
        content: params.system,
      });
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.id,
          messages,
          max_tokens: params.max_tokens || modelConfig.max_tokens,
          temperature: params.temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ZhipuAI API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        choices: Array<{
          message: { content: string };
          finish_reason: string;
        }>;
        usage: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
      };

      return {
        content: data.choices[0]?.message?.content || '',
        usage: {
          input_tokens: data.usage?.prompt_tokens || 0,
          output_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        },
        model: params.model,
        stop_reason: data.choices[0]?.finish_reason,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ZhipuAI request failed: ${error.message}`);
      }
      throw error;
    }
  }
}
