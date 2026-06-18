# Orchestrator Workflow & Design

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User Request (Task)                                            │
│  "Build authentication system with 4 agents"                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Orchestrator.initialize()                                       │
│  - Load config                                                  │
│  - Spawn N agents (with different viewpoints)                   │
│  - Initialize session                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: PLANNING                                              │
│  - Orchestrator proposes initial plan                           │
│  - All agents review plan                                       │
│  - Vote: proceed to architecture or revise?                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              CONSENSUS?      NO → REVISE
                 │               (loop)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: ARCHITECTURE                                          │
│  - Orchestrator proposes architecture based on plan             │
│  - All agents review and debate                                 │
│  - Vote: proceed to implementation or revise?                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              CONSENSUS?      NO → REVISE
                 │               (loop)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: IMPLEMENTATION                                        │
│  - Orchestrator proposes code structure                         │
│  - All agents review                                            │
│  - Vote: proceed or revise?                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              CONSENSUS?      NO → REVISE
                 │               (loop)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  FINALIZE                                                       │
│  - Export full session log                                      │
│  - Generate deadlock report (if any)                            │
│  - Output artifacts                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Orchestrator State Machine

```
[INIT]
   │
   ├─→ [PLANNING] ───→ (vote) ─→ [ARCHITECTURE]
   │        ↑                        │
   │        └────────(revise)◀───────┘
   │
   └─→ [ARCHITECTURE] ─→ (vote) ─→ [IMPLEMENTATION]
            ↑                        │
            └─────────(revise)◀──────┘
   
   └─→ [IMPLEMENTATION] ─→ (vote) ─→ [FINALIZED]
            ↑                        │
            └─────────(revise)◀──────┘
```

## Consensus Round (Detailed)

```
Orchestrator.runConsensusRound(decisionId)
│
├─ Get current proposal
│
├─ FOR EACH AGENT:
│  │
│  ├─ Prepare context (full/summarized/latest)
│  │  - Previous rounds summary
│  │  - Current proposal
│  │  - Outstanding objections
│  │
│  ├─ Invoke Agent.invoke(prompt)
│  │  - Agent queries LLM with system prompt
│  │  - Returns AgentResponse:
│  │    {
│  │      opinion: string
│  │      agreedWithProposal: boolean
│  │      reasonIfDisagreed?: string
│  │      suggestions?: string[]
│  │    }
│  │
│  └─ Log agent response to session
│
├─ Collect all votes
│
├─ Evaluate consensus using VotingEngine
│  │
│  ├─ Calculate weighted score
│  ├─ Check veto agents
│  ├─ Apply voting rule (majority/supermajority/unanimous)
│  │
│  └─ Return ConsensusResult
│
└─ IF consensus achieved:
     → Return result, mark decision as approved
   ELSE IF max rounds not exceeded:
     → Synthesize objections
     → Generate revised proposal
     → Loop (next consensus round)
   ELSE:
     → Generate deadlock report
     → Return deadlock
```

## Proposal Revision Logic

When agents disagree:

```
Orchestrator.reviseProposal(decisionId, prevProposal, objections)
│
├─ Analyze objections from disagreeing agents
│  {
│    agent_A: "Security risk: no rate limiting",
│    agent_B: "Performance issue: O(n²) query",
│    agent_C: "Scalability: doesn't handle 1M users"
│  }
│
├─ Invoke main model (Claude) with prompt:
│  """
│  Given the following proposal and objections,
│  synthesize a revised proposal that addresses all concerns.
│  
│  Original proposal: [proposal]
│  
│  Objections:
│  - Agent A: [reason]
│  - Agent B: [reason]
│  - Agent C: [reason]
│  
│  Revised proposal:
│  """
│
├─ Receive revised proposal from main model
│
├─ Update Decision.proposal
├─ Increment Decision.round
├─ Log revision
│
└─ Return updated Decision
```

## Agent Communication (Hybrid Model)

```
Agent A            Agent B            Agent C
  │                  │                  │
  └──→ Orchestrator ←──┘                │
       (hub)                            │
       │                                │
       ├→ Peer discussion (optional)    │
       │  (copied to log)               │
       │                                │
       └──────────────────→ Agent C ────┘
           (direct message)

All official state changes go through Orchestrator.
Peer discussions are recorded but don't change state.
```

## Session Logging

Every action is logged:

```json
{
  "sessionId": "session-001",
  "entries": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "eventType": "PHASE_STARTED",
      "phase": "PLANNING",
      "data": {}
    },
    {
      "timestamp": "2024-01-15T10:30:05Z",
      "eventType": "DECISION_CREATED",
      "decisionId": "decision-001",
      "data": {
        "title": "Authentication strategy",
        "proposal": "Use JWT with refresh tokens"
      }
    },
    {
      "timestamp": "2024-01-15T10:30:10Z",
      "eventType": "AGENT_RESPONSE",
      "agentId": "agent-security",
      "decisionId": "decision-001",
      "data": {
        "opinion": "Add CSRF protection",
        "agreed": false,
        "reason": "CSRF vulnerability in SPA apps"
      }
    },
    {
      "timestamp": "2024-01-15T10:30:15Z",
      "eventType": "CONSENSUS_ROUND_COMPLETE",
      "decisionId": "decision-001",
      "data": {
        "round": 1,
        "approved": false,
        "consensus": 0.75
      }
    },
    {
      "timestamp": "2024-01-15T10:30:20Z",
      "eventType": "PROPOSAL_REVISED",
      "decisionId": "decision-001",
      "data": {
        "oldProposal": "Use JWT with refresh tokens",
        "newProposal": "Use JWT + refresh tokens + CSRF protection"
      }
    }
  ]
}
```

## Deadlock Handling

```
IF consensus not achieved after maxRounds:

Orchestrator.handleDeadlock(decisionId)
│
├─ Compile deadlock report:
│  {
│    decisionId: "decision-001",
│    rounds: 15,
│    maxRounds: 15,
│    finalProposal: "...",
│    agreeingAgents: ["agent-A", "agent-B"],
│    disagreeingAgents: ["agent-C", "agent-D"],
│    objections: {
│      "agent-C": "Performance concerns unaddressed",
│      "agent-D": "Scalability limits at 1M users"
│    }
│  }
│
├─ Log deadlock event
│
└─ Return report to user
   "Deadlock after 15 rounds. See deadlock report."
```

## Workflow Pseudocode

```typescript
async processTask(task: string): Promise<OrchestratorState> {
  // Initialize
  const decision = createInitialDecision(task);
  this.state.decisions.push(decision);
  
  // PHASE 1: PLANNING
  await this.runPhase(DecisionPhase.PLANNING, decision);
  
  // PHASE 2: ARCHITECTURE
  const archDecision = createArchitectureDecision();
  await this.runPhase(DecisionPhase.ARCHITECTURE, archDecision);
  
  // PHASE 3: IMPLEMENTATION
  const implDecision = createImplementationDecision();
  await this.runPhase(DecisionPhase.IMPLEMENTATION, implDecision);
  
  // Finalize
  return this.finalizeSession();
}

private async runPhase(
  phase: DecisionPhase,
  decision: Decision
): Promise<void> {
  let round = 0;
  let consensusAchieved = false;
  
  while (!consensusAchieved && round < maxRounds) {
    round++;
    decision.round = round;
    
    // Get agent responses
    const responses = await Promise.all(
      this.state.agents.map(agent => agent.invoke(prompt))
    );
    
    // Evaluate consensus
    const result = this.votingEngine.evaluate(responses);
    
    if (result.achieved) {
      consensusAchieved = true;
      decision.finalApproved = true;
    } else {
      // Synthesize objections
      const revision = await this.reviseProposal(
        decision,
        result.objections
      );
      decision.proposal = revision;
    }
  }
  
  if (!consensusAchieved) {
    const deadlock = await this.handleDeadlock(decision);
    this.state.deadlocks.push(deadlock);
  }
}
```
