/**
 * Orchestrator - Main state machine for multi-agent consensus
 */

import { v4 as uuidv4 } from 'uuid';
import {
  OrchestratorState,
  OrchestratorLogEntry,
  Decision,
  DecisionPhase,
  DecisionCategory,
  ConsensusResult,
  OrchestratorConfig,
  SessionConfig,
  AgentConfig,
  AgentViewpoint,
  LLMProvider,
} from '../types';
import { AgentManager } from '../agents/AgentManager';
import { VotingEngine } from '../voting/VotingEngine';
import { SessionStorage } from '../storage/SessionStorage';

export class Orchestrator {
  private config!: OrchestratorConfig;
  private state!: OrchestratorState;
  private agentManager!: AgentManager;
  private votingEngine!: VotingEngine;
  private storage!: SessionStorage;

  async initialize(
    config: OrchestratorConfig,
    sessionConfig: SessionConfig
  ): Promise<void> {
    this.config = config;
    this.storage = new SessionStorage({
      mode: config.storage.mode === 'file' ? 'file' : 'memory',
      path: config.storage.path,
    });

    this.votingEngine = new VotingEngine();

    // Initialize state
    this.state = {
      sessionId: sessionConfig.sessionId,
      agents: [],
      currentPhase: DecisionPhase.PLANNING,
      decisions: [],
      completedRounds: 0,
      deadlocks: [],
      consensusResults: [],
      sessionLog: [],
    };

    // Spawn agents
    this.agentManager = new AgentManager();
    const agentConfigs = this.createAgentConfigs(config.agents);
    this.agentManager.spawnAgents(agentConfigs, config.agents.llmConfigs || []);

    this.logEvent('SESSION_STARTED', {
      sessionId: sessionConfig.sessionId,
      task: sessionConfig.task,
      agentCount: config.agents.count,
    });
  }

  /**
   * Process a task through all phases
   */
  async processTask(task: string): Promise<OrchestratorState> {
    this.logEvent('TASK_RECEIVED', { task });

    // PHASE 1: Planning
    await this.runPhase(
      DecisionPhase.PLANNING,
      `Plan the following task:\n\n${task}`,
      DecisionCategory.ROUTINE
    );

    // PHASE 2: Architecture
    if (this.state.currentDecision && this.state.currentDecision.finalApproved) {
      await this.runPhase(
        DecisionPhase.ARCHITECTURE,
        `Design the architecture for:\n\n${this.state.currentDecision.proposal}`,
        DecisionCategory.ARCHITECTURE
      );
    }

    // PHASE 3: Implementation
    if (this.state.currentDecision && this.state.currentDecision.finalApproved) {
      await this.runPhase(
        DecisionPhase.IMPLEMENTATION,
        `Provide implementation details for:\n\n${this.state.currentDecision.proposal}`,
        DecisionCategory.ROUTINE
      );
    }

    // PHASE 4: Testing & Debugging
    if (this.state.currentDecision && this.state.currentDecision.finalApproved) {
      await this.runPhase(
        DecisionPhase.TESTING,
        `Outline testing strategy and debug considerations for:\n\n${this.state.currentDecision.proposal}`,
        DecisionCategory.ROUTINE
      );
    }

    this.logEvent('TASK_COMPLETED', {
      phases: 4,
      decisionsCount: this.state.decisions.length,
    });

    await this.storage.saveSession(this.state);
    return this.state;
  }

  /**
   * Run a single phase
   */
  private async runPhase(
    phase: DecisionPhase,
    prompt: string,
    category: DecisionCategory
  ): Promise<void> {
    this.state.currentPhase = phase;
    this.logEvent('PHASE_STARTED', { phase });

    const decision: Decision = {
      id: uuidv4(),
      phase,
      category,
      title: `${phase} Decision`,
      description: prompt.substring(0, 100),
      proposal: prompt,
      round: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state.decisions.push(decision);
    this.state.currentDecision = decision;

    const maxRounds = this.config.voting.maxRounds;
    let round = 0;
    let consensusAchieved = false;

    while (!consensusAchieved && round < maxRounds) {
      round++;
      decision.round = round;

      this.logEvent('CONSENSUS_ROUND_STARTED', { phase, round, maxRounds });

      // Get agent responses
      const responses = await this.agentManager.invokeAll(decision.proposal);

      // Evaluate consensus
      const agentWeights: Record<string, number> = {};
      const agentConfigs = this.createAgentConfigs(this.config.agents);
      for (const agentCfg of agentConfigs) {
        agentWeights[agentCfg.id] = agentCfg.weight || 1;
      }

      const result = this.votingEngine.evaluate(
        responses,
        this.config.voting,
        agentWeights
      );

      this.state.consensusResults.push(result);

      // Log responses
      for (const response of responses) {
        this.logEvent('AGENT_RESPONSE', {
          agentId: response.agentId,
          agentName: response.agentName,
          agreed: response.agreedWithProposal,
          opinion: response.opinion.substring(0, 200),
        });
      }

      // Check if consensus achieved
      if (result.achieved) {
        consensusAchieved = true;
        decision.finalApproved = true;
        this.logEvent('CONSENSUS_ACHIEVED', {
          phase,
          round,
          score: result.weightedScore,
        });
      } else if (round < maxRounds) {
        // Revise proposal
        const objections = responses
          .filter((r) => !r.agreedWithProposal)
          .map((r) => `${r.agentName}: ${r.reasonIfDisagreed}`)
          .join('\n');

        decision.proposal = await this.reviseProposal(decision.proposal, objections);
        decision.updatedAt = new Date();

        this.logEvent('PROPOSAL_REVISED', {
          phase,
          round,
          newProposal: decision.proposal.substring(0, 200),
        });
      }
    }

    if (!consensusAchieved) {
      this.logEvent('DEADLOCK_DETECTED', {
        phase,
        round,
        maxRounds,
      });
    }

    this.state.completedRounds += round;
  }

  /**
   * Revise proposal based on objections
   */
  private async reviseProposal(proposal: string, objections: string): Promise<string> {
    // For MVP, synthesize a simple revision
    // In production, this would call the main model to synthesize
    return `${proposal}\n\n[REVISED TO ADDRESS]: ${objections.substring(0, 200)}`;
  }

  /**
   * Create agent configs
   */
  private createAgentConfigs(poolConfig: any): AgentConfig[] {
    const configs: AgentConfig[] = [];

    for (let i = 0; i < poolConfig.count; i++) {
      const viewpoint = (poolConfig.viewpoints as (AgentViewpoint | string)[])[
        i % (poolConfig.viewpoints?.length || 1)
      ];
      const weight = (poolConfig.weights as Record<string, number>)?.[viewpoint as string] || 1;

      configs.push({
        id: `agent-${viewpoint}-${i}`,
        name: this.formatAgentName(viewpoint),
        viewpoint: viewpoint as AgentViewpoint | string,
        llmProvider: poolConfig.defaultLLM?.provider || LLMProvider.ANTHROPIC,
        llmModel: poolConfig.defaultLLM?.model || 'claude-sonnet',
        temperature: poolConfig.defaultLLM?.temperature || 0.7,
        maxTokens: poolConfig.defaultLLM?.maxTokens || 2000,
        weight,
        vetoEnabled: (poolConfig.vetoAgents || []).includes(viewpoint),
      });
    }

    return configs;
  }

  private formatAgentName(viewpoint: string): string {
    return viewpoint
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Logging
   */
  private logEvent(eventType: string, data: Record<string, any>): void {
    const entry: OrchestratorLogEntry = {
      timestamp: new Date(),
      eventType,
      data,
    };
    this.state.sessionLog.push(entry);
  }

  /**
   * Getters
   */
  getState(): OrchestratorState {
    return this.state;
  }

  getSessionLog(): OrchestratorLogEntry[] {
    return this.state.sessionLog;
  }

  getConsensusHistory(): ConsensusResult[] {
    return this.state.consensusResults;
  }

  async getStorage(): Promise<SessionStorage> {
    return this.storage;
  }
}
