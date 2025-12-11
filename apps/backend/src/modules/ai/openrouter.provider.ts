import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMOptions } from './llm-provider.interface';
import teachingPlanSchema from './teaching-plan.schema.json';

@Injectable()
export class OpenRouterProvider implements LLMProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);

  constructor(private readonly apiKey: string) {}

  private sanitizeJsonSchema(schema?: any): any {
    if (!schema) return undefined;
    try {
      const clone = JSON.parse(JSON.stringify(schema));
      const forbidden = ['$schema', '$id', '$ref'];
      const removeKeys = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) return obj.forEach(removeKeys);
        for (const k of Object.keys(obj)) {
          if (forbidden.includes(k)) delete obj[k];
          else removeKeys(obj[k]);
        }
      };
      removeKeys(clone);
      return clone;
    } catch (e) {
      return undefined;
    }
  }

  private get fetchImpl() {
    // Prefer global fetch when available (Node 18+). If not, try dynamic require of undici.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalFetch = (globalThis as any).fetch;
    if (globalFetch) return globalFetch;

    try {
      // Use require dynamically so TypeScript doesn't need the module at compile time
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const undici = require('undici');
      return undici.fetch;
    } catch (e) {
      throw new Error('No fetch implementation available. Install "undici" or run on Node 18+.');
    }
  }

  async generateCompletion(prompt: string, options?: LLMOptions): Promise<string> {
    const model = options?.model || process.env.OPENROUTER_MODEL || 'mistralai/devstral-2512:free';
    const url = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';

    const messages: any[] = [];
    if (options?.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const body: any = {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    };

    // If a response schema is provided (via options) or we have the teaching-plan schema,
    // include it in the OpenRouter request as `response_format: { type: 'json_schema', json_schema: ... }`.
    const responseSchema = options?.responseSchema ?? teachingPlanSchema;
    const sanitized = this.sanitizeJsonSchema(responseSchema as any);
    if (sanitized) {
      body.response_format = {
        type: 'json_schema',
        json_schema: sanitized,
      };
    }

    // Build headers and allow optional referer/title for OpenRouter ranking (if provided)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    const referer = (options as any)?.additionalConfig?.referer || process.env.OPENROUTER_REFERER;
    const title = (options as any)?.additionalConfig?.title || process.env.OPENROUTER_TITLE;
    if (referer) headers['HTTP-Referer'] = referer;
    if (title) headers['X-Title'] = title;

    try {
      this.logger.debug(`Calling OpenRouter (${model}) at ${url}`);
      const res = await this.fetchImpl(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errBody: any = null;
        try {
          errBody = await res.json();
        } catch (e) {
          try { errBody = await res.text(); } catch { errBody = null; }
        }

        // If the error seems related to an invalid/unavailable model, try to fetch available models
        const statusLooksLikeModelProblem = res.status === 400 || res.status === 404;
        const messageText = (typeof errBody === 'string') ? errBody : (errBody?.error?.message || errBody?.message || JSON.stringify(errBody));
        const mentionsModel = /model|modelo|unknown model|invalid model|Model not found/i.test(String(messageText));

        if (statusLooksLikeModelProblem || mentionsModel) {
          try {
            const models = await this.listModels();
            const modelsText = JSON.stringify(models);
            throw new Error(`OpenRouter error: ${res.status} ${res.statusText} - ${messageText}. Available models: ${modelsText}`);
          } catch (listErr) {
            // If listing models failed, include both errors
            const listMsg = listErr?.message ?? String(listErr);
            throw new Error(`OpenRouter error: ${res.status} ${res.statusText} - ${messageText}. Additionally, failed to list models: ${listMsg}`);
          }
        }

        // Generic non-model error
        throw new Error(`OpenRouter error: ${res.status} ${res.statusText} - ${messageText}`);
      }

      const data = await res.json();

      // Try common response shapes
      // 1) { choices: [ { message: { content: '...' } } ] }
      const choice = data.choices?.[0];
      const text = choice?.message?.content ?? choice?.text ?? data.output?.[0]?.content?.parts?.[0];

      if (!text) {
        // Fallback: try to stringify the whole response
        return JSON.stringify(data);
      }

      return text;
    } catch (error: any) {
      // Provide richer logging to diagnose "fetch failed" errors
      try {
        const details = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: (error as any).cause ?? null,
        };
        this.logger.error('Error calling OpenRouter (detailed): ' + JSON.stringify(details));
      } catch (logErr) {
        this.logger.error('Error calling OpenRouter and failed to stringify error', logErr);
      }

      // rethrow so callers can handle
      throw new Error(`OpenRouter fetch failed: ${error?.message ?? String(error)}`);
    }
  }

  async streamCompletion(
    prompt: string,
    options?: LLMOptions,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    // OpenRouter supports SSE for some endpoints; for simplicity we implement a simple non-streaming path.
    const full = await this.generateCompletion(prompt, options);
    if (onChunk) onChunk(full);
    return full;
  }

  async listModels(): Promise<any> {
    const urlCandidates = [
      process.env.OPENROUTER_MODELS_URL || 'https://openrouter.ai/api/v1/models',
      'https://openrouter.ai/api/models',
    ];

    let lastErr: any = null;
    for (const url of urlCandidates) {
      try {
        const res = await this.fetchImpl(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          let body: any = null;
          try { body = await res.json(); } catch { body = await res.text(); }
          throw new Error(`Status ${res.status}: ${JSON.stringify(body)}`);
        }

        const data = await res.json();
        return data;
      } catch (e) {
        lastErr = e;
        this.logger.debug(`Failed to list models from ${url}: ${e?.message ?? e}`);
      }
    }

    throw new Error(`Failed to list OpenRouter models: ${lastErr?.message ?? lastErr}`);
  }

  async test(): Promise<boolean> {
    try {
      await this.generateCompletion('Say OK', { maxTokens: 10 });
      return true;
    } catch (e) {
      this.logger.error('OpenRouter test failed:', e);
      return false;
    }
  }
}
