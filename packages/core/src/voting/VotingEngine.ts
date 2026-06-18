/**
 * Voting Engine - Core Consensus Logic
 */

import {
  ConsensusMode,
  Vote,
  VoteType,
  VotingConfig,
  ConsensusResult,
  AgentResponse,
} from '../types';

export class VotingEngine {
  evaluate(
    agentResponses: AgentResponse[],
    config: VotingConfig,
    agentWeights?: Record<string, number>
  ): ConsensusResult {
    // Convert responses to votes
    const votes = agentResponses.map((response, idx) => ({
      agentId: response.agentId,
      agentName: response.agentName,
      decisionId: `decision-${Date.now()}`,
      round: 1,
      voteType: response.agreedWithProposal ? VoteType.APPROVE : VoteType.REJECT,
      reasoning: response.reasonIfDisagreed || 'Approved',
      weight: agentWeights?.[response.agentId] ?? 1,
      timestamp: new Date(),
    }));

    // Check veto
    if (config.vetoAgents && config.vetoAgents.length > 0) {
      const vetoedBy: string[] = [];
      for (const vetoAgent of config.vetoAgents) {
        const vote = votes.find((v) => v.agentId === vetoAgent);
        if (vote?.voteType === VoteType.REJECT) {
          vetoedBy.push(vetoAgent);
        }
      }
      if (vetoedBy.length > 0) {
        return {
          decisionId: `decision-${Date.now()}`,
          achieved: false,
          mode: config.mode,
          votes,
          approvingAgents: votes
            .filter((v) => v.voteType === VoteType.APPROVE)
            .map((v) => v.agentId),
          rejectingAgents: votes
            .filter((v) => v.voteType === VoteType.REJECT)
            .map((v) => v.agentId),
          abstainedAgents: votes
            .filter((v) => v.voteType === VoteType.ABSTAIN)
            .map((v) => v.agentId),
          vetoedBy,
          round: 1,
          finalProposal: '',
        };
      }
    }

    // Calculate weighted score
    let approvingWeight = 0;
    let totalWeight = 0;

    for (const vote of votes) {
      totalWeight += vote.weight;
      if (vote.voteType === VoteType.APPROVE) {
        approvingWeight += vote.weight;
      }
    }

    const weightedScore = totalWeight > 0 ? approvingWeight / totalWeight : 0;

    // Check consensus based on mode
    let achieved = false;

    switch (config.mode) {
      case ConsensusMode.SIMPLE_MAJORITY:
        achieved = weightedScore >= 0.51;
        break;
      case ConsensusMode.SUPERMAJORITY:
        achieved = weightedScore >= (config.threshold ?? 0.66);
        break;
      case ConsensusMode.MANDATORY_APPROVAL:
        achieved = this.checkMandatoryApproval(votes, config.requiredAgents);
        break;
      case ConsensusMode.UNANIMOUS:
        achieved = weightedScore === 1.0;
        break;
    }

    return {
      decisionId: `decision-${Date.now()}`,
      achieved,
      mode: config.mode,
      votes,
      approvingAgents: votes
        .filter((v) => v.voteType === VoteType.APPROVE)
        .map((v) => v.agentId),
      rejectingAgents: votes
        .filter((v) => v.voteType === VoteType.REJECT)
        .map((v) => v.agentId),
      abstainedAgents: votes
        .filter((v) => v.voteType === VoteType.ABSTAIN)
        .map((v) => v.agentId),
      weightedScore,
      round: 1,
      finalProposal: '',
    };
  }

  private checkMandatoryApproval(votes: Vote[], requiredAgents?: string[]): boolean {
    if (!requiredAgents || requiredAgents.length === 0) return true;

    for (const requiredAgent of requiredAgents) {
      const vote = votes.find((v) => v.agentId === requiredAgent);
      if (!vote || vote.voteType !== VoteType.APPROVE) {
        return false;
      }
    }
    return true;
  }
}
