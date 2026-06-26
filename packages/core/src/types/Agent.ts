/**
 * Agent Types and Interfaces
 */

export enum AgentViewpoint {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  SCALABILITY = 'scalability',
  RELIABILITY = 'reliability',
  MAINTAINABILITY = 'maintainability',
  SIMPLICITY = 'simplicity',
  DEVILS_ADVOCATE = 'devils_advocate',
}

export enum LLMProvider {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  GOOGLE = 'google',
  OPENROUTER = 'openrouter',
  LOCAL = 'local',
}

export interface AgentConfig {
  id: string;
  name: string;
  viewpoint: AgentViewpoint | string;
  systemPrompt?: string;
  llmProvider: LLMProvider | string;
  llmModel: string;
  temperature?: number;
  maxTokens?: number;
  weight?: number; // for weighted voting
  vetoEnabled?: boolean; // agent can veto decisions
}

export interface AgentMessage {
  agentId: string;
  agentName: string;
  viewpoint: AgentViewpoint | string;
  message: string;
  timestamp: Date;
  round: number;
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  viewpoint: AgentViewpoint | string;
  opinion: string;
  agreedWithProposal: boolean;
  reasonIfDisagreed?: string;
  suggestions?: string[];
  timestamp: Date;
  round: number;
}

export interface Agent {
  config: AgentConfig;
  invoke(prompt: string, onChunk?: OnAgentChunk): Promise<AgentResponse>;
  reset(): void;
}

/** Called with each raw text chunk as an agent's response streams in. */
export type OnAgentChunk = (chunk: string) => void;
