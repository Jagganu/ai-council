# AI Council — Architecture & Implementation Plan

## Project Overview

**AI Council** is an open-source multi-agent consensus framework for AI-powered development. It allows users to spawn configurable agents with different perspectives that deliberate through planning, architecture, and implementation phases using democratic voting.

**Target Platforms:** OpenCode, Cursor, Claude Code, CLI, and future tools  
**Tech Stack:** TypeScript, Node.js, npm monorepo  
**License:** MIT  
**Timeline:** v0.1 (6 weeks) → v0.2 (6 weeks) → v1.0 (6 weeks)

---

## Architecture Decisions (Locked In)

```yaml
repository:
  type: monorepo
  language: typescript
  distribution: npm + GitHub

llm:
  providers: [anthropic, openai, google, openrouter, local]
  configurable: true

storage:
  default: file
  options: [memory, file, sqlite, postgres]

communication:
  mode: hybrid_hub_and_spoke
  
consensus:
  modes: [simple_majority, supermajority, mandatory_approval, unanimous]
  configurable: true
  max_rounds: 15

agents:
  type: identical_model
  viewpoints: [security, performance, scalability, reliability, maintainability, simplicity, devils_advocate]

phases: [planning, architecture, implementation]

ui:
  web_dashboard: false (future)
  streaming: true (v0.2+)
  platform_native: true

memory:
  default: session (stateless)
  future: project, global
```

---

## Deliverables Completed

### 1. Monorepo Structure ✅
```
ai-council/
├── packages/
│   ├── core/          Core engine (types, orchestrator, voting)
│   ├── cli/           Command-line interface
│   ├── sdk/           Adapter SDK
│   ├── adapter-opencode/
│   ├── adapter-cursor/
│   └── adapter-claude-code/
├── docs/              Full documentation
├── examples/          Usage examples
├── tests/             Integration tests
└── .github/           CI/CD workflows
```

### 2. TypeScript Types & Interfaces ✅

**Core Types Defined:**
- `Agent` — Agent configuration, invocation interface
- `Decision` — Decision phases, revisions, deadlocks
- `Vote` — Vote types, consensus results, voting rounds
- `Config` — Full configuration schema
- `Orchestrator` — State machine, workflow interface

**Files:**
- `packages/core/src/types/Agent.ts` — Agent types, LLM providers, viewpoints
- `packages/core/src/types/Decision.ts` — Decision phases, categories, deadlocks
- `packages/core/src/types/Vote.ts` — Voting modes, consensus logic
- `packages/core/src/types/Config.ts` — Storage, context, memory modes
- `packages/core/src/types/Orchestrator.ts` — State & workflow

### 3. Configuration Schema ✅

**Document:** `docs/CONFIGURATION.md`

Covers:
- Root configuration structure
- Complete YAML example
- Per-decision voting rules
- Multiple LLM providers
- Environment variable substitution
- Database storage options
- Validation rules

**Key Config Features:**
```yaml
agents:
  count: 4
  viewpoints: [security, performance, scalability, simplicity]
  weights: {security: 4, performance: 3, scalability: 2, simplicity: 1}
  vetoAgents: [security]

voting:
  mode: supermajority
  threshold: 0.75
  maxRounds: 15

storage:
  mode: file
  path: .council/sessions

credentials:
  anthropicApiKey: ${ANTHROPIC_API_KEY}
  openaiApiKey: ${OPENAI_API_KEY}
```

### 4. Orchestrator Workflow ✅

**Document:** `docs/ORCHESTRATOR_WORKFLOW.md`

Covers:
- High-level flow diagram (5 stages)
- State machine (3 phases)
- Consensus round detailed flow
- Proposal revision logic
- Agent communication (hybrid model)
- Session logging (JSON format)
- Deadlock handling
- Workflow pseudocode

**Key Insight:**
```
User Task
  ↓
[INIT] → Spawn N agents
  ↓
[PLANNING] → Deliberate → Vote → Consensus?
  ├─ NO → Revise → Loop
  └─ YES → Next phase
  ↓
[ARCHITECTURE] → ... (same pattern)
  ↓
[IMPLEMENTATION] → ... (same pattern)
  ↓
[FINALIZE] → Export session log + artifacts
```

### 5. Voting & Consensus Engine ✅

**Document:** `docs/VOTING_ENGINE.md`

Covers:
- 4 voting modes with examples
- Weighted voting (custom agent weights)
- Veto system
- Consensus algorithm (pseudocode)
- Per-phase voting rules
- Abstention handling
- Consensus result format
- Voting statistics tracking
- Edge cases
- Performance considerations
- Configuration examples

**Voting Modes:**
1. **Simple Majority** — 50%+1
2. **Supermajority** — 66-75%
3. **Mandatory Approval** — Specific agents must approve
4. **Unanimous** — 100%

### 6. Adapter SDK Specification ✅

**Document:** `docs/ADAPTER_SDK.md`

Covers:
- Core `IAdapterPlugin` interface
- Lifecycle methods (init, shutdown)
- I/O methods (input, display, streaming)
- File handling
- Example implementations:
  - **OpenCode Adapter** — Full example with skill integration
  - **Cursor Adapter** — Chat output pattern
  - **Claude Code Adapter** — Markdown response pattern
  - **CLI Adapter** — Terminal output
- Responsibilities matrix
- Testing pattern
- Summary: 500-1000 LOC per adapter

**Interface:**
```typescript
interface IAdapterPlugin {
  name: string;
  version: string;
  initialize(config: AdapterConfig): Promise<void>;
  shutdown(): Promise<void>;
  requestUserInput(prompt: string): Promise<string>;
  displayMessage(message: string, type?: MessageType): Promise<void>;
  displayAgentResponse(response: AgentMessage): Promise<void>;
  displayVotingResult(result: ConsensusResult): Promise<void>;
  streamAgentThinking(agentId: string, thinking: string): Promise<void>;
  streamVotingProgress(result: ConsensusResult): Promise<void>;
  getConfigPath(): string;
  saveSession(session: OrchestratorState): Promise<void>;
  loadSession(sessionId: string): Promise<OrchestratorState | null>;
}
```

### 7. MVP Roadmap ✅

**Document:** `docs/MVP_ROADMAP.md`

**v0.1.0 — Core Engine & CLI (6 weeks)**
- LLM provider abstraction
- Agent manager & orchestrator
- Voting engine (simple majority + weighted)
- Session management (file-based)
- CLI: review, plan, config, replay
- Documentation
- 70% test coverage
- npm publish

**v0.2.0 — Adapters & Streaming (6 weeks)**
- Adapter SDK
- OpenCode, Cursor, Claude Code adapters
- Real-time streaming
- Deadlock handling
- Advanced voting modes
- Enhanced context management
- Error recovery
- Platform-specific docs

**v1.0.0 — Production Ready (6 weeks)**
- Database storage (SQLite, PostgreSQL)
- Agent learning & memory
- Performance optimization
- Security & access control
- GitHub Actions, Slack, Discord integrations
- Analytics dashboard
- Local LLM support
- 90%+ test coverage

**Effort Estimates:**
- v0.1: 6 weeks (2.5 core, 1 CLI, 1 tests, 1 docs, 0.5 polish)
- v0.2: 8 weeks (1.5 core, 3 adapters, 1.5 tests, 1.5 docs, 0.5 polish)
- v1.0: 8 weeks (2 core, 1 adapters, 1.5 tests, 2 docs, 1 polish)

### 8. GitHub Project Specification ✅

**Document:** `docs/GITHUB_PROJECT_SPEC.md`

Covers:
- Repository setup (name, description, topics)
- 3 milestones (v0.1, v0.2, v1.0) with issue counts
- Label taxonomy (priority, type, status, component, platform)
- Issue templates (feature, bug, documentation)
- PR template
- GitHub Actions workflows (CI, release)
- Development workflow & branch naming
- Commit convention (Conventional Commits)
- Release process
- Code review guidelines
- Community guidelines
- Success metrics

**Key CI/CD:**
- Lint + build + test on every PR
- Auto-publish to npm on tag
- Coverage reporting
- Node 18.x and 20.x support

---

## Documentation Files Created

| File | Purpose | Audience |
|------|---------|----------|
| README.md | Project overview, quick-start | Users |
| CONTRIBUTING.md | Dev setup, code style, PR process | Contributors |
| docs/CONFIGURATION.md | Full config reference | Users/Developers |
| docs/ORCHESTRATOR_WORKFLOW.md | How the engine works | Developers |
| docs/VOTING_ENGINE.md | Voting & consensus logic | Developers |
| docs/ADAPTER_SDK.md | Building adapters | Adapter developers |
| docs/MVP_ROADMAP.md | Release timeline & features | Project managers |
| docs/GITHUB_PROJECT_SPEC.md | Repo structure & process | Maintainers |
| .gitignore | Git ignore rules | Git |
| LICENSE | MIT license | Legal |
| package.json | Root monorepo config | npm |
| tsconfig.json | TypeScript config | TypeScript |

---

## Next Steps: Implementation Order

### Phase 1: Foundation (Weeks 1-2)
- [ ] **Week 1:** Core LLM layer
  - Implement `LLMProvider` abstraction
  - Add Anthropic client
  - Add OpenAI client
  - Write provider tests

- [ ] **Week 2:** Agent & Orchestrator
  - Implement `AgentManager`
  - Implement basic `Orchestrator`
  - Add first integration test

### Phase 2: Consensus Engine (Weeks 3-4)
- [ ] **Week 3:** Voting engine
  - Implement all 4 voting modes
  - Implement weighting & veto
  - Write voting tests (90%+ coverage)

- [ ] **Week 4:** Orchestrator phases
  - Implement 3-phase state machine
  - Add proposal revision logic
  - Add deadlock detection
  - Write end-to-end tests

### Phase 3: CLI & Polish (Weeks 5-6)
- [ ] **Week 5:** CLI commands
  - `council init` — Setup wizard
  - `council review <task>` — Run deliberation
  - `council config` — Show config
  - `council replay <sessionId>` — Replay
  - Output formatters (text, JSON, markdown)

- [ ] **Week 6:** Publishing
  - Fix any remaining issues
  - Write final docs
  - npm publish all packages
  - Create GitHub releases

---

## Key Files to Edit/Create During Implementation

### During v0.1:

**Core Logic:**
```typescript
packages/core/src/
├── llm/
│   ├── providers/
│   │   ├── AnthropicProvider.ts    ← Implement
│   │   ├── OpenAIProvider.ts       ← Implement
│   │   └── index.ts
│   ├── LLMProvider.ts              ← Implement
│   └── index.ts
├── agents/
│   ├── AgentManager.ts             ← Implement
│   ├── Agent.ts                    ← Implement
│   └── index.ts
├── orchestrator/
│   ├── Orchestrator.ts             ← Implement
│   ├── OrchestratorState.ts        ← Implement
│   └── index.ts
├── voting/
│   ├── VotingEngine.ts             ← Implement
│   ├── ConsensusEvaluator.ts       ← Implement
│   └── index.ts
├── storage/
│   ├── SessionStorage.ts           ← Implement
│   └── index.ts
├── config/
│   ├── ConfigLoader.ts             ← Implement
│   └── index.ts
└── index.ts
```

**CLI:**
```typescript
packages/cli/src/
├── commands/
│   ├── InitCommand.ts              ← Implement
│   ├── ReviewCommand.ts            ← Implement
│   ├── ConfigCommand.ts            ← Implement
│   └── ReplayCommand.ts            ← Implement
├── formatters/
│   ├── TextFormatter.ts            ← Implement
│   ├── JSONFormatter.ts            ← Implement
│   └── MarkdownFormatter.ts        ← Implement
└── index.ts
```

**Tests:**
```typescript
tests/
├── unit/
│   ├── voting.test.ts              ← Write
│   ├── agents.test.ts              ← Write
│   └── config.test.ts              ← Write
└── integration/
    ├── end-to-end.test.ts          ← Write
    └── phases.test.ts              ← Write
```

---

## Configuration Files to Create

### Root Level
- ✅ `package.json` — Monorepo with workspaces
- ✅ `tsconfig.json` — TypeScript config
- ✅ `.gitignore` — Git ignore rules
- ✅ `LICENSE` — MIT license
- ✅ `README.md` — Project overview
- ✅ `CONTRIBUTING.md` — Dev guide

### Package Level
- [ ] `packages/core/package.json` — Created, needs scripts
- [ ] `packages/core/tsconfig.json` — Needed
- [ ] `packages/cli/package.json` — Needed
- [ ] `packages/cli/tsconfig.json` — Needed
- [ ] `packages/sdk/package.json` — Needed
- [ ] `packages/sdk/tsconfig.json` — Needed
- [ ] `packages/adapter-*/package.json` — Needed (3x)

### CI/CD
- [ ] `.github/workflows/ci.yml` — Build & test
- [ ] `.github/workflows/release.yml` — npm publish
- [ ] `.github/workflows/codeql.yml` — Code security scan

---

## Estimated Development Effort

| Component | Effort | Notes |
|-----------|--------|-------|
| **LLM Layer** | 1.5 weeks | Provider abstraction, client SDKs |
| **Agent Manager** | 1 week | Agent lifecycle, prompting |
| **Orchestrator** | 2 weeks | State machine, phase transitions |
| **Voting Engine** | 1.5 weeks | All voting modes, weighting |
| **Config System** | 1 week | YAML parsing, validation |
| **Session Storage** | 0.5 weeks | File-based persistence |
| **CLI** | 1 week | Commands, formatters |
| **Tests** | 1.5 weeks | Unit + integration coverage |
| **Docs** | 1 week | Refinement + examples |
| **Polish** | 1 week | Bug fixes, optimization |
| **TOTAL v0.1** | **~12 person-weeks** | 6 calendar weeks with 2 devs |

---

## Success Criteria for Launch

### v0.1 MVP Launch Checklist
- [ ] All 3 phases (planning, architecture, implementation) work
- [ ] 4 agents deliberate with consensus voting
- [ ] Session saved & replayable
- [ ] CLI accessible via `npm install -g ai-council`
- [ ] 70%+ test coverage
- [ ] Zero critical bugs
- [ ] Documentation complete
- [ ] First 10-20 early adopters testing

### v0.2 Adapter Launch Checklist
- [ ] OpenCode, Cursor, Claude Code adapters working
- [ ] Real-time streaming visible in all platforms
- [ ] Deadlock reports generated correctly
- [ ] All adapters published to npm
- [ ] Platform-specific docs complete

### v1.0 Production Launch Checklist
- [ ] 90%+ test coverage
- [ ] Security audit passed
- [ ] Performance benchmarks met (3-5 agents in < 2 min)
- [ ] Database support verified
- [ ] Enterprise customers on-boarded
- [ ] 1000+ GitHub stars

---

## Repository Setup Checklist

Before first commit:

- [ ] Create GitHub repo: `ai-council`
- [ ] Add description & topics
- [ ] Enable branch protection on `main`
- [ ] Create GitHub milestones (v0.1, v0.2, v1.0)
- [ ] Create GitHub labels (priority, type, component, etc.)
- [ ] Add issue templates (feature, bug, docs)
- [ ] Set up CI/CD workflows
- [ ] Configure npm access token for auto-publish
- [ ] Add CODEOWNERS file
- [ ] Enable GitHub Discussions (optional)

---

## Key Design Decisions Explained

### Why TypeScript?
- Strong type safety prevents agent/voting bugs
- OpenCode ecosystem is TS-heavy
- Easy cross-platform compatibility
- Better IDE support

### Why Monorepo?
- Single version number
- Shared CI/CD
- Easy contributor onboarding
- Adapters ship with core

### Why Hybrid Communication?
- Hub (Orchestrator) = audit trail + consistency
- Peer = natural debates still possible
- Best of both worlds

### Why Stateless by Default?
- Predictable behavior
- Easier debugging
- No hidden state surprises
- Learning added in v1.0 when justified

### Why Configurable Voting?
- Different decisions need different thresholds
- Security decisions need veto power
- Routine changes are fast
- Critical changes are slow but thorough

---

## Common Questions During Implementation

**Q: How do agents see previous rounds?**  
A: Orchestrator passes context (full, summarized, or latest) to each agent's system prompt.

**Q: What if agents get stuck in a loop?**  
A: Deadlock detection after `maxRounds` (default 15). Generate report showing objections.

**Q: How do I handle timeouts?**  
A: Add retry logic in LLM provider. If all retries fail, mark agent as "no opinion" and exclude from vote.

**Q: Can users override voting rules?**  
A: Yes, `config.yaml` allows per-phase overrides (planning vs architecture vs implementation).

**Q: Do agents remember past sessions?**  
A: No in v0.1 (stateless). v1.0 adds optional persistent learning.

---

## Resources & References

### Documentation (Created)
- `README.md` — Quick-start for users
- `docs/CONFIGURATION.md` — Full config reference
- `docs/ORCHESTRATOR_WORKFLOW.md` — System design
- `docs/VOTING_ENGINE.md` — Voting logic
- `docs/ADAPTER_SDK.md` — Building adapters
- `docs/MVP_ROADMAP.md` — Release timeline
- `docs/GITHUB_PROJECT_SPEC.md` — Process & governance

### External References
- [Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing](https://jestjs.io/)
- [npm Workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- [Anthropic API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs/)

---

## Final Notes

This architecture balances:
- **Simplicity** — Easy to understand, start coding soon
- **Completeness** — All major components planned
- **Extensibility** — Adapters, providers, voting modes pluggable
- **Pragmatism** — Build MVP first, polish later

The foundation is solid. Now it's time to code. Good luck! 🚀

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Status:** Ready for implementation
