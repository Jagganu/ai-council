/**
 * LLM Provider Interface and Implementations
 */

import { parseSSE } from './sse';

export interface LLMResponse {
  content: string;
  stopReason?: 'end_turn' | 'max_tokens' | 'tool_use';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMProviderConfig {
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string; // for local providers (Ollama, LM Studio)
}

/** Called with each incremental text chunk as it streams in. */
export type OnTokenCallback = (chunk: string) => void;

export abstract class LLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse>;

  /**
   * Streaming variant. Falls back to a single non-streamed call and emits
   * the whole response as one chunk so callers can treat every provider uniformly.
   * Providers that support real token streaming should override this.
   */
  async invokeStream(
    systemPrompt: string,
    userMessage: string,
    onToken: OnTokenCallback
  ): Promise<LLMResponse> {
    const response = await this.invoke(systemPrompt, userMessage);
    onToken(response.content);
    return response;
  }

  protected getTemperature(): number {
    return this.config.temperature ?? 0.7;
  }

  protected getMaxTokens(): number {
    return this.config.maxTokens ?? 2000;
  }
}

export class AnthropicProvider extends LLMProvider {
  private apiBaseUrl = 'https://api.anthropic.com/v1';

  async invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const response = await this.callAPI({
      model: this.config.model,
      max_tokens: this.getMaxTokens(),
      temperature: this.getTemperature(),
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    return {
      content: response.content[0].text,
      stopReason: response.stop_reason as any,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async invokeStream(
    systemPrompt: string,
    userMessage: string,
    onToken: OnTokenCallback
  ): Promise<LLMResponse> {
    const res = await fetch(`${this.apiBaseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.getMaxTokens(),
        temperature: this.getTemperature(),
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: true,
      }),
    });

    if (!res.ok) throw new Error(`Anthropic error (${res.status}): ${await res.text()}`);

    let content = '';
    let stopReason: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const data of parseSSE(res)) {
      let event: any;
      try { event = JSON.parse(data); } catch { continue; }

      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        content += event.delta.text;
        onToken(event.delta.text);
      } else if (event.type === 'message_delta') {
        stopReason = event.delta?.stop_reason ?? stopReason;
        if (event.usage?.output_tokens) outputTokens = event.usage.output_tokens;
      } else if (event.type === 'message_start') {
        inputTokens = event.message?.usage?.input_tokens ?? 0;
      }
    }

    return { content, stopReason: stopReason as any, usage: { inputTokens, outputTokens } };
  }

  private async callAPI(body: any): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };
    if (this.config.apiKey) headers['x-api-key'] = this.config.apiKey;

    const response = await fetch(`${this.apiBaseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Anthropic error (${response.status}): ${await response.text()}`);
    return response.json();
  }
}

export class OpenAIProvider extends LLMProvider {
  protected apiBaseUrl = 'https://api.openai.com/v1';

  protected extraHeaders(): Record<string, string> {
    return {};
  }

  async invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const response = await this.callAPI({
      model: this.config.model,
      max_tokens: this.getMaxTokens(),
      temperature: this.getTemperature(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    return {
      content: response.choices[0].message.content,
      stopReason: response.choices[0].finish_reason === 'stop' ? 'end_turn' : 'max_tokens',
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
      },
    };
  }

  async invokeStream(
    systemPrompt: string,
    userMessage: string,
    onToken: OnTokenCallback
  ): Promise<LLMResponse> {
    const res = await fetch(`${this.apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.extraHeaders(),
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.getMaxTokens(),
        temperature: this.getTemperature(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!res.ok) throw new Error(`${this.constructor.name} error (${res.status}): ${await res.text()}`);

    let content = '';
    let finishReason: string | null = null;

    for await (const data of parseSSE(res)) {
      if (data === '[DONE]') break;
      let event: any;
      try { event = JSON.parse(data); } catch { continue; }

      const delta = event.choices?.[0]?.delta?.content;
      if (delta) { content += delta; onToken(delta); }
      if (event.choices?.[0]?.finish_reason) finishReason = event.choices[0].finish_reason;
    }

    return { content, stopReason: finishReason === 'stop' ? 'end_turn' : 'max_tokens' };
  }

  private async callAPI(body: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        ...this.extraHeaders(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`${this.constructor.name} error (${response.status}): ${await response.text()}`);
    return response.json();
  }
}

/**
 * OpenRouter uses the OpenAI-compatible /chat/completions endpoint.
 * Just points OpenAIProvider at a different base URL + attribution headers.
 */
export class OpenRouterProvider extends OpenAIProvider {
  protected apiBaseUrl = 'https://openrouter.ai/api/v1';

  protected extraHeaders(): Record<string, string> {
    return {
      'HTTP-Referer': 'https://github.com/Jagganu/ai-council',
      'X-Title': 'AI Council',
    };
  }
}

export class GoogleProvider extends LLMProvider {
  private apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  private requestBody(systemPrompt: string, userMessage: string) {
    return {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: this.getTemperature(),
        maxOutputTokens: this.getMaxTokens(),
      },
    };
  }

  async invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const url = `${this.apiBaseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.requestBody(systemPrompt, userMessage)),
    });

    if (!res.ok) throw new Error(`Google error (${res.status}): ${await res.text()}`);

    const data: any = await res.json();
    const candidate = data.candidates?.[0];
    const text = (candidate?.content?.parts ?? []).map((p: any) => p.text || '').join('');

    return {
      content: text,
      stopReason: candidate?.finishReason === 'STOP' ? 'end_turn' : 'max_tokens',
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }

  async invokeStream(
    systemPrompt: string,
    userMessage: string,
    onToken: OnTokenCallback
  ): Promise<LLMResponse> {
    const url = `${this.apiBaseUrl}/models/${this.config.model}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.requestBody(systemPrompt, userMessage)),
    });

    if (!res.ok) throw new Error(`Google error (${res.status}): ${await res.text()}`);

    let content = '';
    let finishReason: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const data of parseSSE(res)) {
      let event: any;
      try { event = JSON.parse(data); } catch { continue; }

      const candidate = event.candidates?.[0];
      const text = (candidate?.content?.parts ?? []).map((p: any) => p.text || '').join('');
      if (text) { content += text; onToken(text); }
      if (candidate?.finishReason) finishReason = candidate.finishReason;
      if (event.usageMetadata?.promptTokenCount) inputTokens = event.usageMetadata.promptTokenCount;
      if (event.usageMetadata?.candidatesTokenCount) outputTokens = event.usageMetadata.candidatesTokenCount;
    }

    return { content, stopReason: finishReason === 'STOP' ? 'end_turn' : 'max_tokens', usage: { inputTokens, outputTokens } };
  }
}

export function createLLMProvider(provider: string, config: LLMProviderConfig): LLMProvider {
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'google':
    case 'gemini':
      return new GoogleProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'ollama': {
      const { LocalLLMProvider } = require('./LocalLLMProvider');
      return new LocalLLMProvider(config);
    }
    case 'lmstudio':
    case 'lm-studio': {
      const { LMStudioProvider } = require('./LocalLLMProvider');
      return new LMStudioProvider(config);
    }
    case 'mock': {
      const { MockLLMProvider } = require('./MockLLMProvider');
      return new MockLLMProvider(config);
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
