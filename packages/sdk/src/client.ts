/**
 * AI Council SDK - Programmatic API
 */

import {
  Orchestrator,
  ConfigLoader,
  OrchestratorConfig,
  SessionConfig,
  OrchestratorState,
  DecisionPhase,
} from '@ai-council/core';

export interface SDKOptions {
  config?: OrchestratorConfig;
  configPath?: string;
  onPhaseStart?: (phase: DecisionPhase) => void;
  onPhaseComplete?: (phase: DecisionPhase, decision: any) => void;
  onAgentResponse?: (response: any) => void;
  onConsensus?: (result: any) => void;
}

export class AICouncilSDK {
  private orchestrator: Orchestrator;
  private config: OrchestratorConfig;
  private options: SDKOptions;

  constructor(options: SDKOptions = {}) {
    this.options = options;
    if (options.configPath) {
      this.config = ConfigLoader.loadFromFile(options.configPath);
    } else if (options.config) {
      this.config = options.config;
    } else {
      this.config = ConfigLoader.createDefault();
    }
    this.orchestrator = new Orchestrator();
  }

  async plan(task: string, onAgentChunk?: (agentId: string, agentName: string, chunk: string, roundKey: string) => void): Promise<OrchestratorState> {
    const sessionId = `sdk-plan-${Date.now()}`;
    await this.orchestrator.initialize(this.config, {
      sessionId,
      task,
      startTime: new Date(),
      orchestratorConfig: this.config,
    });

    // BUG FIX: was calling getState() before processTask(), returning empty state
    return this.orchestrator.processTask(task, onAgentChunk);
  }

  async review(task: string, onAgentChunk?: (agentId: string, agentName: string, chunk: string, roundKey: string) => void): Promise<OrchestratorState> {
    const sessionId = `sdk-${Date.now()}`;
    await this.orchestrator.initialize(this.config, {
      sessionId,
      task,
      startTime: new Date(),
      orchestratorConfig: this.config,
    });
    return this.orchestrator.processTask(task, onAgentChunk);
  }

  getSessionLog() {
    return this.orchestrator.getSessionLog();
  }

  getConsensusHistory() {
    return this.orchestrator.getConsensusHistory();
  }

  static createDefaultConfig(): OrchestratorConfig {
    return ConfigLoader.createDefault();
  }

  static loadConfig(path: string): OrchestratorConfig {
    return ConfigLoader.loadFromFile(path);
  }
}

export default AICouncilSDK;