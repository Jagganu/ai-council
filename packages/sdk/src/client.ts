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

  async review(task: string): Promise<OrchestratorState> {
    const sessionId = `sdk-${Date.now()}`;
    await this.orchestrator.initialize(this.config, {
      sessionId,
      task,
      startTime: new Date(),
      orchestratorConfig: this.config,
    });
    return this.orchestrator.processTask(task);
  }

  async plan(task: string): Promise<OrchestratorState> {
    const sessionId = `sdk-plan-${Date.now()}`;
    await this.orchestrator.initialize(this.config, {
      sessionId,
      task,
      startTime: new Date(),
      orchestratorConfig: this.config,
    });

    const state = this.orchestrator.getState();
    return state;
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