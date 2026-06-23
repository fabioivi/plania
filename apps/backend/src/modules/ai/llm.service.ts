import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { LLMConfigService } from '../auth/llm-config.service';
import { LLMProvider as LLMProviderEnum } from '../auth/llm-config.entity';
import { LLMProvider } from './llm-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { ClaudeProvider } from './claude.provider';
import { OpenRouterProvider } from './openrouter.provider';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);

  constructor(private readonly llmConfigService: LLMConfigService) { }

  /**
   * Get LLM provider instance for a user
   */
  async getProvider(
    userId: string,
    preferredProvider?: LLMProviderEnum,
  ): Promise<LLMProvider> {
    let provider: LLMProviderEnum;

    if (preferredProvider) {
      provider = preferredProvider;
    } else {
      // Try to get the first active provider
      const configs = await this.llmConfigService.getUserConfigs(userId);
      const activeConfig = configs.find((c) => c.isActive);

      if (!activeConfig) {
        throw new NotFoundException(
          'Nenhum provedor de IA configurado. Configure uma chave de API em /settings',
        );
      }

      provider = activeConfig.provider as LLMProviderEnum;
    }

    // Ensure we have the config object if we came from preferredProvider but didn't fetch it yet
    // Optimizing: if we already have activeConfig (from the else block), use it. 
    // If not (preferredProvider case), we might need to fetch it to get additionalConfig.
    // However, getProvider is often called with just userId. 
    // Let's refactor slightly to ensure we have the config.

    let config = await this.llmConfigService.getActiveConfig(userId, provider);

    // Get decrypted API key
    const apiKey = await this.llmConfigService.getDecryptedApiKey(userId, provider);

    // Create provider instance
    switch (provider) {
      case LLMProviderEnum.GEMINI:
        return new GeminiProvider(apiKey, {
          model: config?.modelName,
          ...config?.additionalConfig,
        });
      case LLMProviderEnum.OPENAI:
        return new OpenAIProvider(apiKey, {
          model: config?.modelName,
          ...config?.additionalConfig,
        });
      case LLMProviderEnum.CLAUDE:
        return new ClaudeProvider(apiKey, {
          model: config?.modelName,
          ...config?.additionalConfig,
        });
      case LLMProviderEnum.OPENROUTER:
        this.logger.debug(`[DEBUG] Initializing OpenRouter with config: ${JSON.stringify({
          model: config?.modelName,
          ...config?.additionalConfig
        })}`);
        return new OpenRouterProvider(apiKey, {
          model: config?.modelName,
          ...config?.additionalConfig,
        });
      case LLMProviderEnum.GROK:
        throw new Error('Grok provider not yet implemented');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Test if user has any active LLM provider configured
   */
  async hasActiveProvider(userId: string): Promise<boolean> {
    try {
      await this.getProvider(userId);
      return true;
    } catch {
      return false;
    }
  }
}
