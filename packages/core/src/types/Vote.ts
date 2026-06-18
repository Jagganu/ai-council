/**
 * Voting and Consensus Types
 */

export enum VoteType {
  APPROVE = 'approve',
  REJECT = 'reject',
  ABSTAIN = 'abstain',
}

export enum ConsensusMode {
  SIMPLE_MAJORITY = 'simple_majority', // 50% + 1
  SUPERMAJORITY = 'supermajority', // 66-75%
  MANDATORY_APPROVAL = 'mandatory_approval', // specific agents must approve
  UNANIMOUS = 'unanimous', // 100%
}

export interface Vote {
  agentId: string;
  agentName: string;
  decisionId: string;
  round: number;
  voteType: VoteType;
  reasoning: string;
  weight: number; // 1 by default, can be higher for weighted voting
  timestamp: Date;
}

export interface VotingConfig {
  mode: ConsensusMode;
  threshold?: number; // 0.0 to 1.0 (only for majority/supermajority)
  requiredAgents?: string[]; // agent IDs that must approve (for mandatory approval)
  vetoAgents?: string[]; // agent IDs with veto power
  maxRounds: number;
}

export interface ConsensusResult {
  decisionId: string;
  achieved: boolean;
  mode: ConsensusMode;
  votes: Vote[];
  approvingAgents: string[];
  rejectingAgents: string[];
  abstainedAgents: string[];
  weightedScore?: number; // 0 to 1
  vetoedBy?: string[]; // agent IDs that vetoed
  round: number;
  finalProposal: string;
}

export interface VotingRound {
  roundNumber: number;
  decisionId: string;
  proposal: string;
  votes: Vote[];
  result: ConsensusResult;
  objections: string[]; // reasons for rejection
  createdAt: Date;
}
