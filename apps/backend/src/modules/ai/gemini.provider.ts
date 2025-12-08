import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMOptions } from './llm-provider.interface';

@Injectable()
export class GeminiProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly apiKey: string) {}

  async generateCompletion(prompt: string, options?: LLMOptions): Promise<string> {
    // Tenta usar o modelo mais recente disponível
    let model = options?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: options?.systemPrompt
                ? `${options.systemPrompt}\n\n${prompt}`
                : prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
    };

    try {
      this.logger.debug(`Calling Gemini API with model: ${model}`);
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Fallback para modelo mais antigo se não encontrado
      if (!response.ok && response.status === 404 && model !== 'gemini-1.0-pro') {
        this.logger.warn(`Modelo ${model} não encontrado, tentando fallback para gemini-1.0-pro`);
        model = 'gemini-1.0-pro';
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini');
      }
      const text = data.candidates[0]?.content?.parts[0]?.text;
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      return text;
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  async streamCompletion(
    prompt: string,
    options?: LLMOptions,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    const model = options?.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: options?.systemPrompt
                ? `${options.systemPrompt}\n\n${prompt}`
                : prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
    };

    try {
      this.logger.debug(`Streaming from Gemini API with model: ${model}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      let fullText = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (text) {
                fullText += text;
                if (onChunk) {
                  onChunk(text);
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return fullText;
    } catch (error) {
      this.logger.error('Error streaming from Gemini API:', error);
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
      this.logger.error('Gemini test failed:', error);
      return false;
    }
  }
}
