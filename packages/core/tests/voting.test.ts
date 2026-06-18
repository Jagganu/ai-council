/**
 * Voting Engine Tests
 */

import { VotingEngine } from '../src/voting/VotingEngine';
import {
  ConsensusMode,
  VoteType,
  AgentResponse,
} from '../src/types';

describe('VotingEngine', () => {
  let engine: VotingEngine;

  beforeEach(() => {
    engine = new VotingEngine();
  });

  describe('Simple Majority', () => {
    it('should approve with 50%+1 votes', () => {
      const responses: AgentResponse[] = [
        {
          agentId: 'a1',
          agentName: 'Agent 1',
          viewpoint: 'security',
          opinion: 'Good',
          agreedWithProposal: true,
          timestamp: new Date(),
          round: 1,
        },
        {
          agentId: 'a2',
          agentName: 'Agent 2',
          viewpoint: 'performance',
          opinion: 'Good',
          agreedWithProposal: true,
          timestamp: new Date(),
          round: 1,
        },
        {
          agentId: 'a3',
          agentName: 'Agent 3',
          viewpoint: 'scalability',
          opinion: 'Bad',
          agreedWithProposal: false,
          reasonIfDisagreed: 'Scalability issue',
          timestamp: new Date(),
          round: 1,
        },
      ];

      const result = engine.evaluate(responses, {
        mode: ConsensusMode.SIMPLE_MAJORITY,
        threshold: 0.51,
        maxRounds: 15,
      });

      expect(result.achieved).toBe(true);
      expect(result.weightedScore).toBeCloseTo(0.666, 2);
      expect(result.approvingAgents).toHaveLength(2);
    });

    it('should reject with 50% votes', () => {
      const responses: AgentResponse[] = [
        {
          agentId: 'a1',
          agentName: 'Agent 1',
          viewpoint: 'security',
          opinion: 'Good',
          agreedWithProposal: true,
          timestamp: new Date(),
          round: 1,
        },
        {
          agentId: 'a2',
          agentName: 'Agent 2',
          viewpoint: 'performance',
          opinion: 'Bad',
          agreedWithProposal: false,
          reasonIfDisagreed: 'Performance issue',
          timestamp: new Date(),
          round: 1,
        },
      ];

      const result = engine.evaluate(responses, {
        mode: ConsensusMode.SIMPLE_MAJORITY,
        threshold: 0.51,
        maxRounds: 15,
      });

      expect(result.achieved).toBe(false);
      expect(result.weightedScore).toBeCloseTo(0.5, 1);
    });
  });

  describe('Weighted Voting', () => {
    it('should apply weights correctly', () => {
      const responses: AgentResponse[] = [
        {
          agentId: 'security',
          agentName: 'Security Agent',
          viewpoint: 'security',
          opinion: 'Approved',
          agreedWithProposal: true,
          timestamp: new Date(),
          round: 1,
        },
        {
          agentId: 'performance',
          agentName: 'Performance Agent',
          viewpoint: 'performance',
          opinion: 'Rejected',
          agreedWithProposal: false,
          reasonIfDisagreed: 'Performance concern',
          timestamp: new Date(),
          round: 1,
        },
      ];

      const weights = {
        security: 4,
        performance: 1,
      };

      const result = engine.evaluate(
        responses,
        {
          mode: ConsensusMode.SUPERMAJORITY,
          threshold: 0.75,
          maxRounds: 15,
        },
        weights
      );

      expect(result.weightedScore).toBeCloseTo(0.8, 1);
      expect(result.achieved).toBe(true);
    });
  });

  describe('Veto', () => {
    it('should veto decision if veto agent rejects', () => {
      const responses: AgentResponse[] = [
        {
          agentId: 'security',
          agentName: 'Security Agent',
          viewpoint: 'security',
          opinion: 'Rejected',
          agreedWithProposal: false,
          reasonIfDisagreed: 'Security risk',
          timestamp: new Date(),
          round: 1,
        },
        {
          agentId: 'performance',
          agentName: 'Performance Agent',
          viewpoint: 'performance',
          opinion: 'Approved',
          agreedWithProposal: true,
          timestamp: new Date(),
          round: 1,
        },
        {
          agentId: 'scalability',
          agentName: 'Scalability Agent',
          viewpoint: 'scalability',
          opinion: 'Approved',
          agreedWithProposal: true,
          timestamp: new Date(),
          round: 1,
        },
      ];

      const result = engine.evaluate(responses, {
        mode: ConsensusMode.UNANIMOUS,
        vetoAgents: ['security'],
        maxRounds: 15,
      });

      expect(result.achieved).toBe(false);
      expect(result.vetoedBy).toContain('security');
    });
  });

  describe('Unanimous', () => {
    it('should require all votes', () => {
      const responses: AgentResponse[] = [
        {
          agentId: 'a1',
          agentName: 'Agent 1',
          viewpoint: 'security',
          opinion: 'Approved',
          agreedWithProposal: true,
          timestamp: new Date(),
          round: 1,
        },
        {
          agentId: 'a2',
          agentName: 'Agent 2',
          viewpoint: 'performance',
          opinion: 'Approved',
          agreedWithProposal: true,
          timestamp: new Date(),
          round: 1,
        },
        {
          agentId: 'a3',
          agentName: 'Agent 3',
          viewpoint: 'scalability',
          opinion: 'Rejected',
          agreedWithProposal: false,
          reasonIfDisagreed: 'Not ready',
          timestamp: new Date(),
          round: 1,
        },
      ];

      const result = engine.evaluate(responses, {
        mode: ConsensusMode.UNANIMOUS,
        maxRounds: 15,
      });

      expect(result.achieved).toBe(false);
      expect(result.weightedScore).toBeCloseTo(0.666, 2);
    });
  });
});
