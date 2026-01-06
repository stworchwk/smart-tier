import { BaseProvider } from './base.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { ZhipuProvider } from './zhipu.provider.js';
import type { ProviderConfig } from '../types/index.js';

export { BaseProvider } from './base.provider.js';
export { AnthropicProvider } from './anthropic.provider.js';
export { ZhipuProvider } from './zhipu.provider.js';

export interface ProviderFactory {
  getProvider(name: string): BaseProvider;
  hasProvider(name: string): boolean;
  getAvailableProviders(): string[];
}

/**
 * Create a provider factory from configuration
 */
export function createProviderFactory(
  providersConfig: Record<string, ProviderConfig>
): ProviderFactory {
  const providers = new Map<string, BaseProvider>();

  // Lazy initialization of providers
  function initializeProvider(name: string): BaseProvider {
    const config = providersConfig[name];
    if (!config) {
      throw new Error(`Provider configuration not found: ${name}`);
    }

    let provider: BaseProvider;

    switch (name) {
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      case 'zhipu':
        provider = new ZhipuProvider(config);
        break;
      default:
        // Try to create a generic provider based on API pattern
        // For now, throw an error for unknown providers
        throw new Error(`Unknown provider: ${name}. Supported: anthropic, zhipu`);
    }

    providers.set(name, provider);
    return provider;
  }

  return {
    getProvider(name: string): BaseProvider {
      let provider = providers.get(name);
      if (!provider) {
        provider = initializeProvider(name);
      }
      return provider;
    },

    hasProvider(name: string): boolean {
      return name in providersConfig;
    },

    getAvailableProviders(): string[] {
      return Object.keys(providersConfig);
    },
  };
}

/**
 * Get model info from a provider:model reference
 */
export function getModelFromRef(
  factory: ProviderFactory,
  modelRef: string
): { provider: BaseProvider; modelName: string } {
  const [providerName, modelName] = modelRef.split(':');
  if (!providerName || !modelName) {
    throw new Error(`Invalid model reference: ${modelRef}. Expected format: "provider:model"`);
  }

  const provider = factory.getProvider(providerName);
  if (!provider.hasModel(modelName)) {
    throw new Error(`Model ${modelName} not found in provider ${providerName}`);
  }

  return { provider, modelName };
}
