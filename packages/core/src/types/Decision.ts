/**
 * Decision Types and Interfaces
 */

export enum DecisionCategory {
  ROUTINE = 'routine',
  ARCHITECTURE = 'architecture',
  SECURITY = 'security',
  DEPLOYMENT = 'deployment',
}

export enum DecisionPhase {
  PLANNING = 'planning',
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  TESTING = 'testing',
}

export interface Decision {
  id: string;
  phase: DecisionPhase;
  category: DecisionCategory;
  title: string;
  description: string;
  proposal: string;
  proposedBy?: string;
  round: number;
  createdAt: Date;
  updatedAt: Date;
  finalApproved?: boolean;
}

export interface DecisionRevision {
  decisionId: string;
  revisionNumber: number;
  proposal: string;
  rationale: string;
  authorId: string;
  createdAt: Date;
}

export interface DecisionDeadlock {
  decisionId: string;
  rounds: number;
  maxRounds: number;
  finalProposal: string;
  agreeingAgents: string[];
  disagreeingAgents: string[];
  objections: Map<string, string>; // agentId -> reason
}
