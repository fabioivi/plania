import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMOptions } from './llm-provider.interface';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name);

  constructor(private readonly apiKey: string) {}

  async generateCompletion(prompt: string, options?: LLMOptions): Promise<string> {
    const model = options?.model || 'gpt-4o-mini';
    const url = 'https://api.openai.com/v1/chat/completions';

    const messages: any[] = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const body = {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 8192,
      top_p: options?.topP ?? 1,
    };

    try {
      this.logger.debug(`Calling OpenAI API with model: ${model}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('Empty response from OpenAI');
      }

      return text;
    } catch (error) {
      this.logger.error('Error calling OpenAI API:', error);
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
      this.logger.error('OpenAI test failed:', error);
      return false;
    }
  }
}
