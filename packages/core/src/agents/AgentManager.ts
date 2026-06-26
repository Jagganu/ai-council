/**
 * Agent Manager - Spawns and manages agents
 */

import { AgentConfig, AgentResponse, AgentViewpoint, OnAgentChunk } from '../types';
import { CredentialsConfig } from '../types/Config';
import { LLMProvider, createLLMProvider, LLMProviderConfig } from '../llm/LLMProvider';

export const AGENT_VIEWPOINT_PROMPTS: Record<string, string> = {
  security:
    'You are a security-focused developer. Analyze proposals for vulnerabilities, security risks, and compliance issues. Ask tough questions about authentication, authorization, data protection, and attack vectors.',
  performance:
    'You are a performance-focused engineer. Analyze proposals for scalability, latency, throughput, and resource efficiency. Look for bottlenecks, caching opportunities, and algorithmic improvements.',
  scalability:
    'You are a scalability expert. Consider how systems will perform with 10x, 100x, or 1000x more users/data. Think about distributed systems, load balancing, and architectural limits.',
  reliability:
    'You are a reliability engineer. Focus on fault tolerance, error handling, logging, monitoring, and disaster recovery. Identify single points of failure and resilience gaps.',
  maintainability:
    'You are a maintainability expert. Evaluate code clarity, documentation, testability, and how easy it will be for future developers. Flag technical debt and complexity.',
  simplicity:
    'You are a simplicity advocate. Challenge over-engineering and unnecessary complexity. Prefer simple, straightforward solutions. Ask: "Do we really need this?"',
  devils_advocate:
    "You are devil's advocate. Question every assumption. Find flaws in reasoning. Play the skeptic and identify risks others might miss.",
};

/**
 * Resolves the right API key for a given provider from the credentials block,
 * falling back to the provider's conventional env var.
 *
 * BUG FIX: Previously every agent fell back to ANTHROPIC_API_KEY regardless
 * of which provider it was configured for. Google/OpenRouter agents could
 * never authenticate correctly.
 */
export function resolveApiKey(provider: string, credentials: CredentialsConfig = {}): string {
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return credentials.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '';
    case 'openai':
      return credentials.openaiApiKey || process.env.OPENAI_API_KEY || '';
    case 'google':
    case 'gemini':
      return credentials.googleApiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
    case 'openrouter':
      return credentials.openrouterApiKey || process.env.OPENROUTER_API_KEY || '';
    case 'ollama':
    case 'lmstudio':
    case 'lm-studio':
    case 'mock':
      return 'local'; // local providers don't need a real key
    default:
      return '';
  }
}

export class Agent {
  config: AgentConfig;
  private llmProvider: LLMProvider;

  constructor(config: AgentConfig, llmProvider: LLMProvider) {
    this.config = config;
    this.llmProvider = llmProvider;
  }

  async invoke(prompt: string, onChunk?: OnAgentChunk): Promise<AgentResponse> {
    const systemPrompt =
      this.config.systemPrompt ||
      AGENT_VIEWPOINT_PROMPTS[this.config.viewpoint as string] ||
      'You are a developer providing feedback on proposals.';

    const userMessage = `
Please analyze the following proposal and provide your feedback:

${prompt}

Respond with a JSON object in this exact format:
{
  "opinion": "Your detailed feedback here",
  "agreedWithProposal": true or false,
  "reasonIfDisagreed": "If you disagreed, explain why concisely",
  "suggestions": ["suggestion1", "suggestion2"]
}

Be concise but thorough. Focus on your expertise area.`;

    try {
      const response = onChunk
        ? await this.llmProvider.invokeStream(systemPrompt, userMessage, onChunk)
        : await this.llmProvider.invoke(systemPrompt, userMessage);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        agentId: this.config.id,
        agentName: this.config.name,
        viewpoint: this.config.viewpoint,
        opinion: parsed.opinion || '',
        agreedWithProposal: Boolean(parsed.agreedWithProposal),
        reasonIfDisagreed: parsed.reasonIfDisagreed,
        suggestions: parsed.suggestions || [],
        timestamp: new Date(),
        round: 1,
      };
    } catch (error) {
      console.error(`Agent ${this.config.name} error:`, error);
      throw error;
    }
  }

  reset(): void {}
}

export class AgentManager {
  private agents: Agent[] = [];

  spawnAgents(
    agentConfigs: AgentConfig[],
    llmConfigs: any[],
    credentials: CredentialsConfig = {}
  ): Agent[] {
    const configs = llmConfigs && llmConfigs.length > 0 ? llmConfigs : [{}];

    this.agents = agentConfigs.map((config, idx) => {
      const llmConfig = configs[idx % configs.length];
      const provider = (config.llmProvider as string) || llmConfig.provider || 'anthropic';

      const providerConfig: LLMProviderConfig = {
        apiKey: llmConfig.apiKey || resolveApiKey(provider, credentials),
        model: config.llmModel || llmConfig.model,
        temperature: config.temperature ?? llmConfig.temperature,
        maxTokens: config.maxTokens ?? llmConfig.maxTokens,
        baseUrl: llmConfig.baseUrl,
      };

      const llmProvider = createLLMProvider(provider, providerConfig);
      return new Agent(config, llmProvider);
    });

    return this.agents;
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  /**
   * Invoke every agent concurrently. onAgentChunk fires per-token per-agent
   * so callers can display live streaming output without waiting for all
   * agents to finish.
   */
  async invokeAll(
    prompt: string,
    onAgentChunk?: (agentId: string, agentName: string, chunk: string) => void
  ): Promise<AgentResponse[]> {
    return Promise.all(
      this.agents.map((agent) =>
        agent.invoke(
          prompt,
          onAgentChunk
            ? (chunk) => onAgentChunk(agent.config.id, agent.config.name, chunk)
            : undefined
        )
      )
    );
  }

  reset(): void {
    this.agents.forEach((agent) => agent.reset());
  }
}
