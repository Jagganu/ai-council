/**
 * Configuration Types
 */

import { AgentViewpoint, LLMProvider } from './Agent';
import { VotingConfig, ConsensusMode } from './Vote';

export enum StorageMode {
  MEMORY = 'memory',
  FILE = 'file',
  SQLITE = 'sqlite',
  POSTGRES = 'postgres',
}

export enum ContextMode {
  FULL = 'full',
  SUMMARIZED = 'summarized',
  LATEST_ONLY = 'latest_only',
}

export enum MemoryMode {
  SESSION = 'session',
  PROJECT = 'project',
  GLOBAL = 'global',
}

export interface CredentialsConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  openrouterApiKey?: string;
  localModelUrl?: string;
}

export interface LLMConfig {
  provider: LLMProvider | string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentPoolConfig {
  count: number;
  viewpoints?: AgentViewpoint[] | string[];
  llmConfigs?: LLMConfig[];
  defaultLLM?: LLMConfig;
  weights?: Record<string, number>;
  vetoAgents?: string[];
}

export interface OrchestratorConfig {
  name?: string;
  description?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  storage: {
    mode: StorageMode;
    path?: string; // for file storage
    connectionString?: string; // for db storage
  };
  context: {
    mode: ContextMode;
    maxHistoryRounds?: number;
  };
  memory: {
    mode: MemoryMode;
  };
  voting: VotingConfig;
  agents: AgentPoolConfig;
  credentials: CredentialsConfig;
}

export interface SessionConfig {
  sessionId: string;
  task: string;
  startTime: Date;
  orchestratorConfig: OrchestratorConfig;
}
