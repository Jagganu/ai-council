# Voting & Consensus Engine Design

## Core Concept

The Voting Engine evaluates agent responses and determines if consensus has been achieved based on configurable rules.

## Voting Modes

### 1. Simple Majority
```
Threshold: 50% + 1

Example (4 agents):
YES: 3
NO:  1
──────
RESULT: APPROVED (75% > 50%)
```

### 2. Supermajority
```
Threshold: 66% - 75%

Example (4 agents, 75% threshold):
YES: 3
NO:  1
──────
RESULT: APPROVED (75% >= 75%)
```

### 3. Mandatory Approval
```
Specific agents must approve, regardless of majority.

Config:
requiredAgents: [security, testing]

Example:
Security:   YES
Testing:    YES
Architect:  YES
Reviewer:   NO
────────────────
RESULT: APPROVED (all required agents approved)

---

Security:   NO
Testing:    YES
Architect:  YES
Reviewer:   YES
────────────────
RESULT: REJECTED (security did not approve)
```

### 4. Unanimous
```
Threshold: 100%

Example (4 agents):
Agent A: YES
Agent B: YES
Agent C: NO
Agent D: YES
───────────────
RESULT: REJECTED (not unanimous)
```

## Weighted Voting

Agents can have different weights in decisions:

```yaml
agents:
  weights:
    security: 4      # Most important
    architect: 3
    reviewer: 2
    coder: 1
```

Calculation:
```
Score = (agreeing_weight / total_weight)

Example:
Security (4):   YES  → +4
Architect (3):  YES  → +3
Reviewer (2):   NO   → +0
Coder (1):      YES  → +1
─────────────────────────
Total: 8/10 = 80%

Threshold: 75% → APPROVED
```

## Veto System

Veto agents can block decisions:

```yaml
agents:
  vetoAgents:
    - security
    - compliance
```

Veto logic:
```
IF any veto agent votes NO:
  → DECISION REJECTED (regardless of other votes)

IF all veto agents vote YES (or abstain):
  → Apply normal voting rules
```

Example with veto:
```
Security (veto):   NO
Architect:         YES
Reviewer:          YES
Coder:             YES
─────────────────────
RESULT: REJECTED (security has veto)
```

## Consensus Algorithm

```typescript
evaluateConsensus(votes: Vote[], config: VotingConfig): ConsensusResult {
  // 1. Check veto
  for (const vetoAgent of config.vetoAgents) {
    const vetoVote = votes.find(v => v.agentId === vetoAgent);
    if (vetoVote?.voteType === VoteType.REJECT) {
      return {
        achieved: false,
        vetoedBy: [vetoAgent],
        ...
      };
    }
  }
  
  // 2. Calculate weighted score
  let approvingWeight = 0;
  let totalWeight = 0;
  
  for (const vote of votes) {
    const weight = agentWeights[vote.agentId] ?? 1;
    totalWeight += weight;
    
    if (vote.voteType === VoteType.APPROVE) {
      approvingWeight += weight;
    }
  }
  
  const score = approvingWeight / totalWeight;
  
  // 3. Check threshold
  let achieved = false;
  
  switch (config.mode) {
    case ConsensusMode.SIMPLE_MAJORITY:
      achieved = score >= 0.51;
      break;
    
    case ConsensusMode.SUPERMAJORITY:
      achieved = score >= (config.threshold ?? 0.66);
      break;
    
    case ConsensusMode.MANDATORY_APPROVAL:
      achieved = checkMandatoryApproval(votes, config.requiredAgents);
      break;
    
    case ConsensusMode.UNANIMOUS:
      achieved = score === 1.0;
      break;
  }
  
  return {
    achieved,
    score,
    votes,
    ...
  };
}
```

## Per-Phase Voting Rules

Different decisions have different thresholds:

```yaml
voting:
  phases:
    planning:
      mode: simple_majority
      threshold: 0.51
      maxRounds: 5
    
    architecture:
      mode: supermajority
      threshold: 0.75
      maxRounds: 15
    
    implementation:
      mode: supermajority
      threshold: 0.66
      maxRounds: 10
```

## Abstention Handling

Agents can abstain from voting:

```
VoteType.ABSTAIN → Not counted in consensus

Example (4 agents):
Agent A: YES
Agent B: YES
Agent C: ABSTAIN
Agent D: NO
──────────────────
Count: 2 YES, 1 NO, 1 ABSTAIN
Consensus: 2/3 = 66.7% > 50% → APPROVED
```

## Consensus Result Format

```typescript
interface ConsensusResult {
  decisionId: string;
  achieved: boolean;
  mode: ConsensusMode;
  round: number;
  
  // Vote breakdown
  votes: Vote[];
  approvingAgents: string[];
  rejectingAgents: string[];
  abstainedAgents: string[];
  
  // Weighted score (0-1)
  weightedScore: number;
  
  // Veto information
  vetoedBy?: string[];
  
  // Final proposal after this round
  finalProposal: string;
  
  // Objections for revision
  objections: string[];
}
```

## Voting Statistics

Track voting patterns for learning:

```typescript
interface VotingStatistics {
  decisionId: string;
  totalRounds: number;
  consensusAchieved: boolean;
  roundsToConsensus?: number;
  
  // Agent voting patterns
  agentVotes: {
    [agentId: string]: {
      approvalsCount: number;
      rejectionsCount: number;
      abstentionsCount: number;
      consistencyScore: number; // How often they voted with majority
    }
  }
  
  // Decision category patterns
  byCategory: {
    [category: string]: {
      averageRounds: number;
      consensusRate: number;
      mostCommonObjection: string;
    }
  }
}
```

## Edge Cases

### 1. All Agents Abstain
```
Result: Not achieved, ask agents to provide opinion
```

### 2. Single Agent
```
Mode: Unanimous → Agent approval = consensus
```

### 3. Mixed Veto and Weighted Voting
```
Security (veto, weight 4): NO
Architect (weight 3): YES
Reviewer (weight 2): YES
───────────────────────────
RESULT: REJECTED (veto overrides)
```

### 4. Changing Vote Mid-Round
```
Not applicable. Votes are immutable per round.
If agent changes mind, new round required.
```

## Performance Considerations

- Weighted voting: O(n) where n = agents
- Veto check: O(v) where v = veto agents
- Consensus evaluation: O(n) total
- Storage: O(r × n) where r = rounds, n = agents

For typical configs (4-10 agents, 15 max rounds): negligible.

## Configuration Examples

### Strict Security Review
```yaml
voting:
  mode: mandatory_approval
  requiredAgents:
    - security
    - compliance
  maxRounds: 20
```

### Fast Iteration (Development)
```yaml
voting:
  mode: simple_majority
  threshold: 0.51
  maxRounds: 5
```

### Balanced (Default)
```yaml
voting:
  mode: supermajority
  threshold: 0.75
  maxRounds: 15
```

### Production Deployment
```yaml
voting:
  mode: unanimous
  vetoAgents:
    - security
    - testing
  maxRounds: 25
```
