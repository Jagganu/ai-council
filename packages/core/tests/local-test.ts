/**
 * Local test without LLM API calls (mock agents)
 */

import { VotingEngine } from '../src/voting/VotingEngine';
import { ConfigLoader } from '../src/config/ConfigLoader';
import { SessionStorage } from '../src/storage/SessionStorage';
import { ConsensusMode, AgentResponse } from '../src/types';

async function testVotingEngine() {
  console.log('Testing Voting Engine...');

  const engine = new VotingEngine();
  const responses: AgentResponse[] = [
    {
      agentId: 'security',
      agentName: 'Security Agent',
      viewpoint: 'security',
      opinion: 'Looks good',
      agreedWithProposal: true,
      timestamp: new Date(),
      round: 1,
    },
    {
      agentId: 'performance',
      agentName: 'Performance Agent',
      viewpoint: 'performance',
      opinion: 'Needs optimization',
      agreedWithProposal: false,
      reasonIfDisagreed: 'Too slow',
      timestamp: new Date(),
      round: 1,
    },
    {
      agentId: 'scalability',
      agentName: 'Scalability Agent',
      viewpoint: 'scalability',
      opinion: 'Good',
      agreedWithProposal: true,
      timestamp: new Date(),
      round: 1,
    },
  ];

  const result = engine.evaluate(responses, {
    mode: ConsensusMode.SUPERMAJORITY,
    threshold: 0.75,
    maxRounds: 15,
  });

  console.log('✓ Voting result:', {
    achieved: result.achieved,
    score: result.weightedScore,
    approving: result.approvingAgents.length,
    rejecting: result.rejectingAgents.length,
  });
}

async function testConfigLoader() {
  console.log('\nTesting Config Loader...');

  const config = ConfigLoader.createDefault();
  console.log('✓ Default config created');
  console.log('  - Agents:', config.agents.count);
  console.log('  - Voting mode:', config.voting.mode);
  console.log('  - Max rounds:', config.voting.maxRounds);
}

async function testSessionStorage() {
  console.log('\nTesting Session Storage...');

  const storage = new SessionStorage({ mode: 'memory' });
  const mockSession = {
    sessionId: 'test-1',
    agents: [],
    currentPhase: 'planning' as any,
    decisions: [],
    completedRounds: 0,
    deadlocks: [],
    consensusResults: [],
    sessionLog: [],
  };

  await storage.saveSession(mockSession);
  const loaded = await storage.loadSession('test-1');

  console.log('✓ Session saved and loaded');
  console.log('  - Session ID:', loaded?.sessionId);

  const sessions = await storage.listSessions();
  console.log('  - Sessions count:', sessions.length);
}

async function runTests() {
  console.log('🧪 Running Core Tests\n');

  try {
    await testVotingEngine();
    await testConfigLoader();
    await testSessionStorage();

    console.log('\n✅ All core tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
