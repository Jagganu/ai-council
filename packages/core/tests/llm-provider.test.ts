/**
 * LLM Provider Tests
 *
 * Specifically covers the credential routing bug fix (agents previously
 * always fell back to ANTHROPIC_API_KEY regardless of provider) and
 * that createLLMProvider wires the right class for each provider name.
 */

import { resolveApiKey } from '../src/agents/AgentManager';
import {
  createLLMProvider,
  AnthropicProvider,
  OpenAIProvider,
  GoogleProvider,
  OpenRouterProvider,
  LLMProvider,
} from '../src/llm/LLMProvider';
import { MockLLMProvider } from '../src/llm/MockLLMProvider';

describe('resolveApiKey', () => {
  const envKeys = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY'];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of envKeys) { saved[k] = process.env[k]; delete process.env[k]; }
  });

  afterEach(() => {
    for (const k of envKeys) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
  });

  it('routes each provider to its own credential', () => {
    const creds = {
      anthropicApiKey: 'anthropic-key',
      openaiApiKey: 'openai-key',
      googleApiKey: 'google-key',
      openrouterApiKey: 'openrouter-key',
    };
    expect(resolveApiKey('anthropic', creds)).toBe('anthropic-key');
    expect(resolveApiKey('openai', creds)).toBe('openai-key');
    expect(resolveApiKey('google', creds)).toBe('google-key');
    expect(resolveApiKey('openrouter', creds)).toBe('openrouter-key');
  });

  it('regression: never returns the Anthropic key for a different provider', () => {
    const creds = { anthropicApiKey: 'should-not-leak' };
    expect(resolveApiKey('google', creds)).not.toBe('should-not-leak');
    expect(resolveApiKey('openrouter', creds)).not.toBe('should-not-leak');
    expect(resolveApiKey('openai', creds)).not.toBe('should-not-leak');
  });

  it('falls back to provider-specific env var', () => {
    process.env.GOOGLE_API_KEY = 'from-env';
    expect(resolveApiKey('google', {})).toBe('from-env');
  });

  it('explicit credentials win over env vars', () => {
    process.env.GOOGLE_API_KEY = 'from-env';
    expect(resolveApiKey('google', { googleApiKey: 'from-config' })).toBe('from-config');
  });

  it('gemini alias resolves the same as google', () => {
    process.env.GOOGLE_API_KEY = 'gemini-env-key';
    expect(resolveApiKey('gemini', {})).toBe('gemini-env-key');
  });

  it('returns empty string for unknown provider', () => {
    expect(resolveApiKey('not-real', {})).toBe('');
  });
});

describe('createLLMProvider', () => {
  const config = { apiKey: 'test-key', model: 'test-model' };

  it('creates the right class for each provider', () => {
    expect(createLLMProvider('anthropic', config)).toBeInstanceOf(AnthropicProvider);
    expect(createLLMProvider('openai', config)).toBeInstanceOf(OpenAIProvider);
    expect(createLLMProvider('google', config)).toBeInstanceOf(GoogleProvider);
    expect(createLLMProvider('gemini', config)).toBeInstanceOf(GoogleProvider);
    expect(createLLMProvider('openrouter', config)).toBeInstanceOf(OpenRouterProvider);
    expect(createLLMProvider('mock', config)).toBeInstanceOf(MockLLMProvider);
  });

  it('is case-insensitive', () => {
    expect(createLLMProvider('OpenRouter', config)).toBeInstanceOf(OpenRouterProvider);
    expect(createLLMProvider('GOOGLE', config)).toBeInstanceOf(GoogleProvider);
    expect(createLLMProvider('Anthropic', config)).toBeInstanceOf(AnthropicProvider);
  });

  it('throws for unsupported provider', () => {
    expect(() => createLLMProvider('not-real', config)).toThrow('Unsupported LLM provider');
  });

  it('OpenRouterProvider is OpenAI-compatible (extends OpenAIProvider)', () => {
    expect(createLLMProvider('openrouter', config)).toBeInstanceOf(OpenAIProvider);
  });
});

describe('LLMProvider.invokeStream default fallback', () => {
  it('emits full response as single chunk when provider does not override streaming', async () => {
    class BasicProvider extends LLMProvider {
      async invoke() { return { content: 'hello world' }; }
    }
    const chunks: string[] = [];
    const result = await new BasicProvider({ apiKey: 'k', model: 'm' })
      .invokeStream('sys', 'user', (c) => chunks.push(c));

    expect(chunks).toEqual(['hello world']);
    expect(result.content).toBe('hello world');
  });
});

describe('MockLLMProvider', () => {
  it('streamed chunks reassemble to the same content as invoke()', async () => {
    const provider = new MockLLMProvider({ apiKey: 'mock', model: 'mock' });
    let streamed = '';
    const result = await provider.invokeStream('sys', 'user', (c) => { streamed += c; });
    expect(streamed).toBe(result.content);
  });

  it('invoke() returns valid JSON matching AgentResponse shape', async () => {
    const provider = new MockLLMProvider({ apiKey: 'mock', model: 'mock' });
    const result = await provider.invoke('sys', 'user');
    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty('opinion');
    expect(parsed).toHaveProperty('agreedWithProposal');
    expect(typeof parsed.agreedWithProposal).toBe('boolean');
  });
});
