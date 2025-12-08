import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { LLMConfigService } from '../auth/llm-config.service';
import { LLMProvider as LLMProviderEnum } from '../auth/llm-config.entity';
import { LLMProvider } from './llm-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { ClaudeProvider } from './claude.provider';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);

  constructor(private readonly llmConfigService: LLMConfigService) {}

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

    // Get decrypted API key
    const apiKey = await this.llmConfigService.getDecryptedApiKey(userId, provider);

    // Create provider instance
    switch (provider) {
      case LLMProviderEnum.GEMINI:
        return new GeminiProvider(apiKey);
      case LLMProviderEnum.OPENAI:
        return new OpenAIProvider(apiKey);
      case LLMProviderEnum.CLAUDE:
        return new ClaudeProvider(apiKey);
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
