export interface LLMProvider {
  /**
   * Generate a completion using the LLM
   */
  generateCompletion(prompt: string, options?: LLMOptions): Promise<string>;

  /**
   * Stream a completion using the LLM (for real-time generation)
   */
  streamCompletion?(
    prompt: string,
    options?: LLMOptions,
    onChunk?: (chunk: string) => void,
  ): Promise<string>;

  /**
   * Test if the provider is available and configured
   */
  test(): Promise<boolean>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  model?: string;
  topP?: number;
  topK?: number;
  responseSchema?: any; // JSON Schema for structured responses
}

export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'claude' | 'grok' | 'openrouter';
  apiKey: string;
  model?: string;
  options?: Partial<LLMOptions>;
}
