# MVP Roadmap: From v0.1 to v1.0

## Release Timeline

```
v0.1 (MVP)           → Core Engine + CLI + Documentation
  4-6 weeks
      ↓
v0.2 (Adapters)      → OpenCode, Cursor, Claude Code adapters
  4-6 weeks
      ↓
v1.0 (Stable)        → Production-ready, all platforms, full docs
  4-6 weeks
```

---

## v0.1.0 — Core Engine & CLI (MVP)

**Goal:** Prove the concept works. CLI-first, focused, minimal scope.

**Timeline:** 4-6 weeks

### Scope

#### `@ai-council/core`

- [x] Type definitions (Agent, Decision, Vote, Orchestrator, Config)
- [ ] LLM Provider Abstraction
  - Anthropic (Claude) support
  - OpenAI fallback
  - Configurable retry logic
- [ ] Agent Manager
  - Spawn N agents with configured viewpoints
  - Each agent has a system prompt (e.g., "You are a security-focused developer")
  - Agent-LLM invocation with context
- [ ] Orchestrator (core state machine)
  - Initialize from config
  - Run PLANNING phase
  - Run ARCHITECTURE phase
  - Run IMPLEMENTATION phase
  - Handle phase transitions
- [ ] Voting Engine
  - Simple majority (v0.1)
  - Weighted voting (basic)
  - Veto system (basic)
  - Consensus evaluation
- [ ] Session Management
  - File-based session storage (.council/sessions/)
  - Session log (JSON)
  - Session export/import
- [ ] Config Loading
  - YAML parsing
  - Env var substitution
  - Validation
  - Defaults

#### `@ai-council/cli`

- [ ] CLI entry point (`council` command)
- [ ] Commands:
  - `council review <task>` — Run full deliberation
  - `council plan <task>` — Just planning phase
  - `council config` — Show current config
  - `council list-sessions` — List past sessions
  - `council replay <sessionId>` — Replay deliberation
- [ ] Configuration setup
  - `council init` — Create .council/config.yaml
  - Interactive setup wizard
- [ ] Output formatting
  - Plain text (default)
  - JSON (for piping)
  - Markdown

#### Documentation

- [ ] README.md (getting started)
- [ ] INSTALLATION.md (npm install, setup)
- [ ] QUICK_START.md (first deliberation)
- [ ] CONFIGURATION.md (full config reference) — already drafted
- [ ] ORCHESTRATOR_WORKFLOW.md (how it works) — already drafted
- [ ] VOTING_ENGINE.md (voting rules) — already drafted
- [ ] CLI_REFERENCE.md (command docs)
- [ ] CONTRIBUTING.md (for developers)

#### Examples

- [ ] examples/simple-auth.yaml — Simple CLI run
- [ ] examples/cursor-integration.js — Cursor command
- [ ] examples/opencode-skill.ts — OpenCode skill

#### Tests

- [ ] Unit tests for VotingEngine
- [ ] Unit tests for Agent invocation
- [ ] Integration test: simple 3-agent deliberation
- [ ] Config parsing tests

### Non-Goals for v0.1

- ❌ Web UI
- ❌ Database storage (file-only)
- ❌ Adapter for OpenCode/Cursor/Claude Code
- ❌ Advanced voting (mandatory approval, unanimous only simple majority)
- ❌ Agent memory between sessions
- ❌ Performance optimization
- ❌ Error recovery

### Deliverables

```
ai-council/
├── packages/
│   ├── core/src/
│   │   ├── types/           [DONE]
│   │   ├── llm/             [LLM provider abstraction]
│   │   ├── agents/          [Agent manager]
│   │   ├── orchestrator/    [State machine]
│   │   ├── voting/          [Consensus engine]
│   │   ├── storage/         [Session I/O]
│   │   ├── config/          [YAML parsing]
│   │   └── index.ts         [Exports]
│   │
│   └── cli/src/
│       ├── commands/        [review, plan, config, etc.]
│       ├── formatters/      [text, json, markdown]
│       └── index.ts         [CLI entry]
│
├── docs/                    [All .md files]
├── examples/                [YAML + code examples]
└── tests/                   [Jest tests]
```

### Success Criteria

- [ ] Users can run: `council review "build a login system"`
- [ ] All 4 agents deliberate and vote
- [ ] Session saved to `.council/sessions/session-xxx.json`
- [ ] Can replay: `council replay session-xxx`
- [ ] Consensus achieved for planning phase
- [ ] Full test coverage of core logic
- [ ] npm package published

---

## v0.2.0 — Adapters & Streaming (Extended)

**Goal:** Integration with real tools (OpenCode, Cursor, Claude Code).

**Timeline:** 4-6 weeks

### Scope

#### `@ai-council/sdk`

- [ ] Adapter interface (IAdapterPlugin) — already drafted
- [ ] Base adapter class with utilities
- [ ] Streaming helpers
- [ ] Message formatting

#### `@ai-council/adapter-opencode`

- [ ] Implement IAdapterPlugin
- [ ] OpenCode Skill (`/council review`)
- [ ] Panel display integration
- [ ] Session persistence in OpenCode
- [ ] Tests

#### `@ai-council/adapter-cursor`

- [ ] Implement IAdapterPlugin
- [ ] Cursor command: "Council Review"
- [ ] Chat output formatting
- [ ] Tests

#### `@ai-council/adapter-claude-code`

- [ ] Implement IAdapterPlugin
- [ ] API integration (if needed)
- [ ] Response formatting
- [ ] Tests

#### Features

- [ ] Real-time streaming
  - Agent thinking → display as "thinking..."
  - Voting progress → progress bar
  - Proposal revisions → show diff
- [ ] Deadlock handling
  - Generate deadlock report
  - Explain unresolved objections
  - Suggest human intervention
- [ ] Advanced voting modes
  - Supermajority threshold
  - Mandatory approval groups
  - Unanimous for critical decisions
- [ ] Better context management
  - Summarization of long deliberations
  - Latest-only mode (cheaper)
- [ ] Error recovery
  - Retry failed LLM calls
  - Handle timeouts gracefully
  - Partial consensus fallback

#### Documentation

- [ ] ADAPTER_SDK.md (already drafted)
- [ ] ADAPTER_DEVELOPMENT.md (tutorial)
- [ ] OPENCODE_INTEGRATION.md
- [ ] CURSOR_INTEGRATION.md
- [ ] CLAUDE_CODE_INTEGRATION.md
- [ ] TROUBLESHOOTING.md

### Deliverables

```
ai-council/
├── packages/
│   ├── core/         [Refined from v0.1]
│   ├── cli/          [Refined from v0.1]
│   │
│   ├── sdk/src/
│   │   ├── IAdapterPlugin.ts
│   │   ├── BaseAdapter.ts
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── adapter-opencode/src/
│   │   ├── CouncilAdapter.ts
│   │   ├── CouncilSkill.ts
│   │   └── index.ts
│   │
│   ├── adapter-cursor/src/
│   │   ├── CouncilAdapter.ts
│   │   ├── VSCodeCommand.ts
│   │   └── index.ts
│   │
│   └── adapter-claude-code/src/
│       ├── CouncilAdapter.ts
│       └── index.ts
│
└── docs/             [All .md files]
```

### Success Criteria

- [ ] `/council review` works in OpenCode
- [ ] "Council Review" command works in Cursor
- [ ] Claude Code can invoke council
- [ ] Real-time streaming visible in all platforms
- [ ] Deadlock reports generated
- [ ] All adapter tests pass
- [ ] Each adapter published to npm

---

## v1.0.0 — Production Ready

**Goal:** Stable, feature-complete, enterprise-ready.

**Timeline:** 4-6 weeks

### Scope

#### Core Enhancements

- [ ] Database storage option
  - SQLite support
  - PostgreSQL support
  - Query builder for session analytics
- [ ] Agent persistence & learning
  - Remember past decisions
  - Improve categorization over time
  - Learning curve: votes vs actual outcomes
- [ ] Performance optimization
  - Parallel agent invocation
  - LLM call batching
  - Caching for similar proposals
- [ ] Security & access control
  - API key vaulting
  - Session encryption
  - RBAC for multi-tenant setups
- [ ] Observability
  - Prometheus metrics export
  - Structured logging (JSON)
  - Tracing support (OpenTelemetry)

#### Features

- [ ] Custom agent archetypes (user-defined)
- [ ] Plugin system for custom voting rules
- [ ] Webhook notifications (when consensus reached)
- [ ] Diff visualization for proposal revisions
- [ ] Agent feedback loop (rate proposal quality)
- [ ] Consensus analytics dashboard
  - Time to consensus by decision type
  - Agent agreement patterns
  - Most common objections
- [ ] Batch operations
  - Deliberate on multiple tasks
  - Compare consensus across tasks
  - Export analytics

#### Integrations

- [ ] GitHub Actions integration
  - PR review with council agents
  - Auto-merge on consensus
- [ ] Slack notifications
- [ ] Discord bot
- [ ] VS Code Remote support
- [ ] Local LLM support (Ollama, LM Studio)

#### Documentation

- [ ] Video tutorials (5-10 min each)
- [ ] Architecture deep dive
- [ ] Performance tuning guide
- [ ] Scaling to enterprise
- [ ] Security best practices
- [ ] API reference (OpenAPI/Swagger)
- [ ] Case studies

#### Quality

- [ ] 90%+ test coverage
- [ ] Load testing (10-50 agents)
- [ ] Security audit
- [ ] Performance benchmarks
- [ ] End-to-end tests for all adapters

### Deliverables

- All v0.2 packages
- `@ai-council/analytics` (dashboard)
- `@ai-council/plugins` (custom rules)
- `@ai-council/integrations` (GitHub, Slack, etc.)
- Complete documentation
- Release notes & migration guide

### Success Criteria

- [ ] Used in 50+ projects
- [ ] 1000+ GitHub stars
- [ ] Enterprise support tier available
- [ ] 99.9% uptime for core service
- [ ] All security audits pass
- [ ] Performance: 3-5 agents deliberate in < 2 min

---

## Phased Implementation Details

### Phase 1: Core Foundations (Week 1-2)

- [ ] Implement LLM provider abstraction
- [ ] Build AgentManager
- [ ] Implement VotingEngine (simple majority)
- [ ] Write unit tests
- [ ] First end-to-end test

### Phase 2: Orchestration (Week 3-4)

- [ ] Build Orchestrator state machine
- [ ] Implement all 3 phases (planning, architecture, impl)
- [ ] Session persistence
- [ ] Config parsing & validation

### Phase 3: CLI & Polish (Week 5-6)

- [ ] CLI commands
- [ ] Output formatters
- [ ] CLI tests
- [ ] Documentation
- [ ] npm publish

---

## Effort Estimates

| Component | v0.1 (weeks) | v0.2 (weeks) | v1.0 (weeks) |
|-----------|--------------|--------------|--------------|
| Core      | 2.5          | 1.5          | 2            |
| CLI       | 1            | 0.5          | 0.5          |
| Adapters  | —            | 3            | 1            |
| Tests     | 1            | 1.5          | 1.5          |
| Docs      | 1            | 1.5          | 2            |
| Polish    | 0.5          | 0.5          | 1            |
| **Total** | **6 weeks**  | **8 weeks**  | **8 weeks**  |

---

## Risks & Mitigations

### Risk 1: LLM API Costs
- **Mitigation:** Implement caching, batching, cheaper models for testing

### Risk 2: Consensus Never Achieved (Infinite Loop)
- **Mitigation:** Max rounds limit, deadlock detection, clear reporting

### Risk 3: Agent Output Unpredictable
- **Mitigation:** Strict prompts, output parsing, fallback logic

### Risk 4: Slow LLM Calls Block UI
- **Mitigation:** Async/await, streaming, progress indicators

### Risk 5: Platform API Changes
- **Mitigation:** Adapter abstraction isolates platform changes

---

## Success Metrics

| Metric | v0.1 | v0.2 | v1.0 |
|--------|------|------|------|
| Users | 10-20 (beta) | 50-100 | 1000+ |
| GitHub Stars | 50-100 | 200-500 | 1000+ |
| npm Downloads | 100-500 | 1000-5000 | 10000+ |
| Test Coverage | 70% | 85% | 90%+ |
| Consensus Rate | 70% | 80% | 85%+ |
| Avg Time (3 agents) | < 5 min | < 3 min | < 2 min |
