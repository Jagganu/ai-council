/**
 * Agent Manager - Spawns and manages agents
 */

import { AgentConfig, AgentResponse, AgentViewpoint } from '../types';
import { LLMProvider, createLLMProvider, LLMProviderConfig } from '../llm/LLMProvider';

export const AGENT_VIEWPOINT_PROMPTS: Record<AgentViewpoint | string, string> = {
  [AgentViewpoint.SECURITY]:
    'You are a security-focused developer. Analyze proposals for vulnerabilities, security risks, and compliance issues. Ask tough questions about authentication, authorization, data protection, and attack vectors.',
  [AgentViewpoint.PERFORMANCE]:
    'You are a performance-focused engineer. Analyze proposals for scalability, latency, throughput, and resource efficiency. Look for bottlenecks, caching opportunities, and algorithmic improvements.',
  [AgentViewpoint.SCALABILITY]:
    'You are a scalability expert. Consider how systems will perform with 10x, 100x, or 1000x more users/data. Think about distributed systems, load balancing, and architectural limits.',
  [AgentViewpoint.RELIABILITY]:
    'You are a reliability engineer. Focus on fault tolerance, error handling, logging, monitoring, and disaster recovery. Identify single points of failure and resilience gaps.',
  [AgentViewpoint.MAINTAINABILITY]:
    'You are a maintainability expert. Evaluate code clarity, documentation, testability, and how easy it will be for future developers. Flag technical debt and complexity.',
  [AgentViewpoint.SIMPLICITY]:
    'You are a simplicity advocate. Challenge over-engineering and unnecessary complexity. Prefer simple, straightforward solutions. Ask: "Do we really need this?"',
  [AgentViewpoint.DEVILS_ADVOCATE]:
    "You are devil's advocate. Question every assumption. Find flaws in reasoning. Play the skeptic and identify risks others might miss.",
};

export class Agent {
  config: AgentConfig;
  private llmProvider: LLMProvider;

  constructor(config: AgentConfig, llmProvider: LLMProvider) {
    this.config = config;
    this.llmProvider = llmProvider;
  }

  async invoke(prompt: string): Promise<AgentResponse> {
    const systemPrompt =
      this.config.systemPrompt ||
      AGENT_VIEWPOINT_PROMPTS[this.config.viewpoint] ||
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
      const response = await this.llmProvider.invoke(systemPrompt, userMessage);

      // Parse the JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

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

  reset(): void {
    // Reset agent state for next round
  }
}

export class AgentManager {
  private agents: Agent[] = [];

  spawnAgents(
    agentConfigs: AgentConfig[],
    llmConfigs: any[] // Accept any LLM config shape
  ): Agent[] {
    // ponytail: ensure llmConfigs is never empty
    const configs = llmConfigs && llmConfigs.length > 0 ? llmConfigs : [{}];
    this.agents = agentConfigs.map((config, idx) => {
      const llmConfig = configs[idx % configs.length];
      const llmProvider = createLLMProvider(config.llmProvider, {
        apiKey: llmConfig.apiKey || process.env.ANTHROPIC_API_KEY || '',
        model: config.llmModel || llmConfig.model,
        temperature: config.temperature ?? llmConfig.temperature,
        maxTokens: config.maxTokens ?? llmConfig.maxTokens,
      });

      return new Agent(config, llmProvider);
    });

    return this.agents;
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  async invokeAll(prompt: string): Promise<AgentResponse[]> {
    const responses = await Promise.all(this.agents.map((agent) => agent.invoke(prompt)));
    return responses;
  }

  reset(): void {
    this.agents.forEach((agent) => agent.reset());
  }
}
