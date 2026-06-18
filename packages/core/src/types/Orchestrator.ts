/**
 * Orchestrator Types and Interfaces
 */

import { Decision, DecisionPhase, DecisionDeadlock } from './Decision';
import { ConsensusResult } from './Vote';
import { Agent } from './Agent';
import { OrchestratorConfig, SessionConfig } from './Config';

export interface OrchestratorState {
  sessionId: string;
  agents: Agent[];
  currentPhase: DecisionPhase;
  currentDecision?: Decision;
  decisions: Decision[];
  completedRounds: number;
  deadlocks: DecisionDeadlock[];
  consensusResults: ConsensusResult[];
  sessionLog: OrchestratorLogEntry[];
}

export interface OrchestratorLogEntry {
  timestamp: Date;
  eventType: string;
  agentId?: string;
  decisionId?: string;
  data: Record<string, unknown>;
}

export interface OrchestratorWorkflow {
  initiateDecision(decision: Decision): Promise<void>;
  runConsensusRound(decisionId: string): Promise<ConsensusResult>;
  reviseProposal(decisionId: string, revision: string): Promise<Decision>;
  moveToNextPhase(decisionId: string): Promise<DecisionPhase>;
  handleDeadlock(decisionId: string): Promise<DecisionDeadlock>;
  finalizeSession(): Promise<OrchestratorState>;
}

export interface Orchestrator extends OrchestratorWorkflow {
  config: OrchestratorConfig;
  state: OrchestratorState;
  initialize(config: OrchestratorConfig, sessionConfig: SessionConfig): Promise<void>;
  processTask(task: string): Promise<OrchestratorState>;
  getSessionLog(): OrchestratorLogEntry[];
  exportSession(): Promise<string>; // JSON export
  getConsensusHistory(): ConsensusResult[];
}
