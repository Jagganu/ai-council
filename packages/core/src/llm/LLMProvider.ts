/**
 * LLM Provider Interface and Implementations
 */

export interface LLMResponse {
  content: string;
  stopReason?: 'end_turn' | 'max_tokens' | 'tool_use';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class LLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse>;

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
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
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

  private async callAPI(body: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    return response.json();
  }
}

export class OpenAIProvider extends LLMProvider {
  private apiBaseUrl = 'https://api.openai.com/v1';

  async invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const response = await this.callAPI({
      model: this.config.model,
      max_tokens: this.getMaxTokens(),
      temperature: this.getTemperature(),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
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

  private async callAPI(body: any): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    return response.json();
  }
}

export function createLLMProvider(
  provider: string,
  config: LLMProviderConfig
): LLMProvider {
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'mock': {
      // ponytail: lazy import to avoid circular dependency
      const { MockLLMProvider } = require('./MockLLMProvider');
      return new MockLLMProvider(config);
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
