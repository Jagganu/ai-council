/**
 * Local LLM Provider - Ollama, LM Studio, etc.
 */

import { LLMProvider, LLMResponse, LLMProviderConfig } from './LLMProvider';

export class LocalLLMProvider extends LLMProvider {
  private baseUrl: string;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  async invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const url = `${this.baseUrl}/api/generate`;

    const body = {
      model: this.config.model || 'llama2',
      prompt: `${systemPrompt}\n\n${userMessage}`,
      stream: false,
      options: {
        temperature: this.getTemperature(),
        num_predict: this.getMaxTokens(),
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Local LLM API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as { response?: string; prompt_eval_count?: number; eval_count?: number };
    return {
      content: data.response || '',
      stopReason: 'end_turn',
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
      },
    };
  }
}

export class LMStudioProvider extends LLMProvider {
  private baseUrl: string;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:1234/v1';
  }

  async invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model: this.config.model || 'local-model',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: this.getTemperature(),
      max_tokens: this.getMaxTokens(),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string }; finish_reason?: string }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content || '',
      stopReason: (choice?.finish_reason as 'end_turn' | 'max_tokens' | 'tool_use') || 'stop',
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }
}