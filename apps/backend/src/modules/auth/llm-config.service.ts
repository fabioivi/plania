import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMConfig, LLMProvider } from './llm-config.entity';
import { CryptoService } from '../../common/services/crypto.service';

export interface CreateLLMConfigDto {
  provider: LLMProvider;
  apiKey: string;
  modelName?: string;
  isActive?: boolean;
  additionalConfig?: Record<string, any>;
}

export interface UpdateLLMConfigDto {
  apiKey?: string;
  modelName?: string;
  isActive?: boolean;
  additionalConfig?: Record<string, any>;
}

export interface LLMConfigResponse {
  id: string;
  provider: LLMProvider;
  modelName: string | null;
  isActive: boolean;
  additionalConfig: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  // API key is never returned in responses
}

@Injectable()
export class LLMConfigService {
  constructor(
    @InjectRepository(LLMConfig)
    private llmConfigRepository: Repository<LLMConfig>,
    private cryptoService: CryptoService,
  ) {}

  /**
   * Create or update LLM configuration for a user
   */
  async saveConfig(
    userId: string,
    dto: CreateLLMConfigDto,
  ): Promise<LLMConfigResponse> {
    console.log('🔍 saveConfig called with userId:', userId);
    console.log('🔍 DTO:', dto);

    // Check if config already exists for this user and provider
    const existing = await this.llmConfigRepository.findOne({
      where: { userId, provider: dto.provider },
    });

    // Encrypt the API key
    const encrypted = this.cryptoService.encrypt(dto.apiKey);

    if (existing) {
      // Update existing config
      existing.encryptedApiKey = encrypted.encrypted;
      existing.iv = encrypted.iv;
      existing.authTag = encrypted.authTag;
      existing.modelName = dto.modelName || existing.modelName;
      const willActivate = dto.isActive === true;
      existing.isActive = dto.isActive ?? existing.isActive;
      if (willActivate) {
        // Deactivate other configs for this user
        await this.llmConfigRepository.update({ userId, provider: existing.provider }, { isActive: false });
        existing.isActive = true;
      }
      existing.additionalConfig = dto.additionalConfig || existing.additionalConfig;

      const updated = await this.llmConfigRepository.save(existing);
      return this.toResponse(updated);
    } else {
      // Create new config
      console.log('🔍 Creating new config with userId:', userId);
      const isActive = dto.isActive ?? false;
      if (isActive) {
        // If creating an active config, deactivate others for this user
        try {
          const others = await this.llmConfigRepository.find({ where: { userId } });
          for (const c of others) {
            if (c.isActive) {
              c.isActive = false;
            }
          }
          if (others.length) await this.llmConfigRepository.save(others);
        } catch (e) {
          // ignore
        }
      }

      const config = this.llmConfigRepository.create({
        userId,
        provider: dto.provider,
        encryptedApiKey: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        modelName: dto.modelName,
        isActive,
        additionalConfig: dto.additionalConfig,
      });

      console.log('🔍 Config object before save:', config);
      const saved = await this.llmConfigRepository.save(config);
      return this.toResponse(saved);
    }
  }

  private get fetchImpl() {
    // Prefer global fetch when available (Node 18+). If not, try dynamic require of undici.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalFetch = (globalThis as any).fetch;
    if (globalFetch) return globalFetch;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const undici = require('undici');
      return undici.fetch;
    } catch (e) {
      throw new Error('No fetch implementation available. Install "undici" or run on Node 18+.');
    }
  }

  /**
   * Get all LLM configurations for a user
   */
  async getUserConfigs(userId: string): Promise<LLMConfigResponse[]> {
    const configs = await this.llmConfigRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return configs.map((config) => this.toResponse(config));
  }

  /**
   * Get a specific LLM configuration
   */
  async getConfig(userId: string, configId: string): Promise<LLMConfigResponse> {
    const config = await this.llmConfigRepository.findOne({
      where: { id: configId, userId },
    });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    return this.toResponse(config);
  }

  /**
   * Get decrypted API key for a specific provider
   * This is used internally by AI services, not exposed to API
   */
  async getDecryptedApiKey(userId: string, provider: LLMProvider): Promise<string> {
    const config = await this.llmConfigRepository.findOne({
      where: { userId, provider, isActive: true },
    });

    if (!config) {
      throw new NotFoundException(`No active ${provider} configuration found`);
    }

    return this.cryptoService.decrypt({
      encrypted: config.encryptedApiKey,
      iv: config.iv,
      authTag: config.authTag,
    });
  }

  /**
   * Get active configuration for a provider
   */
  async getActiveConfig(
    userId: string,
    provider: LLMProvider,
  ): Promise<LLMConfig | null> {
    return this.llmConfigRepository.findOne({
      where: { userId, provider, isActive: true },
    });
  }

  /**
   * Update LLM configuration
   */
  async updateConfig(
    userId: string,
    configId: string,
    dto: UpdateLLMConfigDto,
  ): Promise<LLMConfigResponse> {
    const config = await this.llmConfigRepository.findOne({
      where: { id: configId, userId },
    });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    // Update API key if provided
    if (dto.apiKey) {
      const encrypted = this.cryptoService.encrypt(dto.apiKey);
      config.encryptedApiKey = encrypted.encrypted;
      config.iv = encrypted.iv;
      config.authTag = encrypted.authTag;
    }

    // Update other fields
    if (dto.modelName !== undefined) config.modelName = dto.modelName;
    const willActivate = dto.isActive === true;
    if (dto.isActive !== undefined) {
      config.isActive = dto.isActive;
      if (willActivate) {
        // deactivate other configs for this user
        try {
          const others = await this.llmConfigRepository.find({ where: { userId } });
          for (const c of others) {
            if (c.id !== configId && c.isActive) c.isActive = false;
          }
          await this.llmConfigRepository.save(others);
          config.isActive = true;
        } catch (e) {
          // ignore
        }
      }
    }
    if (dto.additionalConfig !== undefined)
      config.additionalConfig = dto.additionalConfig;

    const updated = await this.llmConfigRepository.save(config);
    return this.toResponse(updated);
  }

  /**
   * Activate a specific LLM config for the user and deactivate others.
   * Ensures there is at most one active configuration per user.
   */
  async activateConfig(userId: string, configId: string): Promise<LLMConfigResponse> {
    const config = await this.llmConfigRepository.findOne({ where: { id: configId, userId } });
    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    // Fetch all user configs and toggle isActive accordingly
    const userConfigs = await this.llmConfigRepository.find({ where: { userId } });
    for (const c of userConfigs) {
      c.isActive = c.id === configId;
    }

    await this.llmConfigRepository.save(userConfigs);

    const activated = await this.llmConfigRepository.findOne({ where: { id: configId } });
    return this.toResponse(activated!);
  }

  /**
   * Delete LLM configuration
   */
  async deleteConfig(userId: string, configId: string): Promise<void> {
    const config = await this.llmConfigRepository.findOne({
      where: { id: configId, userId },
    });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    await this.llmConfigRepository.remove(config);
  }

  /**
   * Test if an API key is valid by making a simple API call
   */
  async testApiKey(userId: string, configId: string): Promise<{ success: boolean; message: string }> {
    const config = await this.llmConfigRepository.findOne({
      where: { id: configId, userId },
    });

    if (!config) {
      throw new NotFoundException('LLM configuration not found');
    }

    const apiKey = this.cryptoService.decrypt({
      encrypted: config.encryptedApiKey,
      iv: config.iv,
      authTag: config.authTag,
    });

    // Test the API key based on provider
    try {
      switch (config.provider) {
        case LLMProvider.GEMINI:
          return await this.testGeminiApiKey(apiKey);
        case LLMProvider.OPENAI:
          return await this.testOpenAIApiKey(apiKey);
        case LLMProvider.CLAUDE:
          return await this.testClaudeApiKey(apiKey);
        case LLMProvider.OPENROUTER:
          return await this.testOpenRouterApiKey(apiKey);
        case LLMProvider.GROK:
          return await this.testGrokApiKey(apiKey);
        default:
          throw new BadRequestException('Unsupported provider');
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to test API key',
      };
    }
  }

  /**
   * Convert entity to response DTO (without API key)
   */
  private toResponse(config: LLMConfig): LLMConfigResponse {
    return {
      id: config.id,
      provider: config.provider,
      modelName: config.modelName,
      isActive: config.isActive,
      additionalConfig: config.additionalConfig,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  // API Testing Methods

  private async testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchImpl(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
    );
    
    if (response.ok) {
      return { success: true, message: 'API key is valid' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }
  }

  private async testOpenAIApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchImpl('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'API key is valid' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }
  }

  private async testClaudeApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (response.ok || response.status === 400) { // 400 is ok, means API key works but request invalid
      return { success: true, message: 'API key is valid' };
    } else {
      const error = await response.json();
      return { success: false, message: error.error?.message || 'Invalid API key' };
    }
  }

  private async testGrokApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    // Grok uses OpenAI-compatible API
    const response = await this.fetchImpl('https://api.x.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'API key is valid' };
    } else {
      return { success: false, message: 'Invalid API key' };
    }
  }

  private async testOpenRouterApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const url = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
    try {
      const res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || 'mistralai/devstral-2512:free',
          messages: [{ role: 'user', content: ' testar ' }],
          max_tokens: 1,
        }),
      });

      if (res.ok) {
        return { success: true, message: 'API key is valid' };
      }

      // Some providers return 4xx with a body
      let body: any;
      try { body = await res.json(); } catch { body = null; }
      return { success: false, message: body?.error?.message || `Invalid API key (status ${res.status})` };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to test OpenRouter key' };
    }
  }
}
