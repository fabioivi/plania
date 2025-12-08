import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMOptions } from './llm-provider.interface';

@Injectable()
export class ClaudeProvider implements LLMProvider {
  private readonly logger = new Logger(ClaudeProvider.name);

  constructor(private readonly apiKey: string) {}

  async generateCompletion(prompt: string, options?: LLMOptions): Promise<string> {
    const model = options?.model || 'claude-3-5-sonnet-20241022';
    const url = 'https://api.anthropic.com/v1/messages';

    const body = {
      model,
      max_tokens: options?.maxTokens ?? 8192,
      temperature: options?.temperature ?? 0.7,
      system: options?.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    try {
      this.logger.debug(`Calling Claude API with model: ${model}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Claude');
      }

      return text;
    } catch (error) {
      this.logger.error('Error calling Claude API:', error);
      throw error;
    }
  }

  async test(): Promise<boolean> {
    try {
      await this.generateCompletion('Say "OK" if you can read this.', {
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      this.logger.error('Claude test failed:', error);
      return false;
    }
  }
}
