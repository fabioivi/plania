import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMOptions } from './llm-provider.interface';

@Injectable()
export class GeminiProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly apiKey: string) {}

  private sanitizeResponseSchema(schema?: any): any {
    if (!schema) return undefined;
    try {
      const clone = JSON.parse(JSON.stringify(schema));
      const removeKeys = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          for (const it of obj) removeKeys(it);
          return;
        }
        // Remove properties that Gemini rejects (metadata and JSON-Schema keywords)
        // Keep descriptions and required where possible, but drop fields likely unsupported by the API.
        const forbidden = [
          '$schema',
          '$id',
          '$ref',
          'additionalProperties',
          'patternProperties',
          'definitions',
          'dependentSchemas',
          'unevaluatedProperties',
          'additionalItems',
          'examples'
        ];
        for (const f of forbidden) delete obj[f];

        for (const k of Object.keys(obj)) removeKeys(obj[k]);
      };
      removeKeys(clone);
      return clone;
    } catch (e) {
      return undefined;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      const data = await response.json();
      return data.models
        .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model: any) => model.name.replace('models/', ''));
    } catch (error) {
      this.logger.error('Error listing models:', error);
      return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']; // fallback
    }
  }

  async generateCompletion(prompt: string, options?: LLMOptions): Promise<string> {
    // Tenta usar o modelo mais recente disponível
    let model = options?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const sanitizedSchema = this.sanitizeResponseSchema(options?.responseSchema);

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
        ...(sanitizedSchema && {
          responseMimeType: 'application/json',
          responseSchema: sanitizedSchema,
        }),
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

      // Fallback para modelos alternativos se não encontrado
      if (!response.ok && response.status === 404) {
        this.logger.error(`Modelo ${model} não encontrado. Listando modelos disponíveis...`);
        const availableModels = await this.listModels();
        this.logger.log(`Modelos disponíveis: ${availableModels.join(', ')}`);
        
        const fallbackModels = availableModels.filter(m => m !== model);
        
        for (const fallbackModel of fallbackModels) {
          this.logger.warn(`Tentando fallback para ${fallbackModel}`);
          model = fallbackModel;
          url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });
          if (response.ok) {
            this.logger.log(`Sucesso com modelo ${fallbackModel}`);
            break;
          }
        }
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
    let model = options?.model || 'gemini-2.5-flash';
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;

    const sanitizedSchema = this.sanitizeResponseSchema(options?.responseSchema);

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
        ...(sanitizedSchema && {
          responseMimeType: 'application/json',
          responseSchema: sanitizedSchema,
        }),
      },
    };

    try {
      this.logger.debug(`Streaming from Gemini API with model: ${model}`);

      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Fallback para modelos alternativos se não encontrado
        if (response.status === 404) {
          this.logger.error(`Modelo ${model} não encontrado. Listando modelos disponíveis...`);
          const availableModels = await this.listModels();
          this.logger.log(`Modelos disponíveis: ${availableModels.join(', ')}`);
          
          const fallbackModels = availableModels.filter(m => m !== model);
          
          for (const fallbackModel of fallbackModels) {
            this.logger.warn(`Tentando fallback para ${fallbackModel}`);
            model = fallbackModel;
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;
            response = await fetch(fallbackUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
            });
            if (response.ok) {
              this.logger.log(`Sucesso com modelo ${fallbackModel}`);
              break;
            }
          }
        }
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
        }
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
