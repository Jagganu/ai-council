# MVP Roadmap: From v0.1 to v1.0

## Release Timeline

```
v0.1 (MVP)           → Core Engine + CLI + Documentation    ✓
  4-6 weeks (completed)
      ↓
v0.2 (Adapters)      → OpenCode, Cursor, Claude Code
  4-6 weeks
      ↓
v1.0 (Stable)        → Production-ready, analytics, integrations
  4-6 weeks
```

---

## v0.1.0 — Core Engine & CLI (MVP) ✓

**Goal:** Prove the concept works. CLI-first, focused, minimal scope.

**Status:** ✓ Complete

### Scope

#### `@ai-council/core`

- [x] Type definitions (Agent, Decision, Vote, Orchestrator, Config)
- [x] LLM Provider Abstraction
  - Anthropic (Claude) support
  - OpenAI fallback
  - Mock provider for testing
- [x] Agent Manager
  - Spawn N agents with configured viewpoints
  - Each agent has a system prompt
  - Agent-LLM invocation with context
- [x] Orchestrator (core state machine)
  - Initialize from config
  - 4-phase deliberation: Planning → Architecture → Implementation → Testing
  - Phase transitions with proposal revision
  - Deadlock detection
- [x] Voting Engine
  - Simple majority
  - Supermajority
  - Weighted voting
  - Veto system
  - Consensus evaluation
- [x] Session Management
  - File-based session storage (.council/sessions/)
  - Session log (JSON)
  - Session replay

#### `@ai-council/cli`

- [x] CLI entry point (`council` command)
- [x] Commands:
  - `council review <task>` — Run full deliberation
  - `council plan <task>` — Just planning phase
  - `council config` — Show current config
  - `council list` — List past sessions
  - `council replay <sessionId>` — Replay deliberation
  - `council init` — Create .council/config.yaml
- [x] Configuration setup
  - Interactive setup wizard

#### Documentation

- [x] README.md (getting started)
- [x] CONFIGURATION.md (full config reference)
- [x] ORCHESTRATOR_WORKFLOW.md (how it works)
- [x] VOTING_ENGINE.md (voting rules)
- [x] CONTRIBUTING.md (for developers)
- [x] ARCHITECTURE_PLAN.md
- [x] ADAPTER_SDK.md

#### Tests

- [x] Unit tests for VotingEngine
- [x] Unit tests for ConfigLoader
- [x] Integration test: full 4-agent deliberation
- [x] Config parsing tests

### Non-Goals for v0.1

- ❌ Web UI
- ❌ Database storage (file-only)
- ❌ Adapt ers for OpenCode/Cursor/Claude Code
- ❌ Agent memory between sessions
- ❌ Performance optimization

### Deliverables

| Package | Description | Status |
|---------|------------|--------|
| `@ai-council/core` | Consensus & orchestration engine | ✅ v0.1.0 |
| `@ai-council/cli` | Command-line interface | ✅ v0.1.0 |

---

## v0.2.0 — Adapters

**Goal:** Integrate with OpenCode, Cursor, and Claude Code.

**Timeline:** 4-6 weeks

### Scope

#### Adapters

- [ ] `adapter-opencode` — OpenCode skill that calls council
  - CouncilSkill.ts
  - Triggers on `/council` slash command
  - Streams results into response
- [ ] `adapter-cursor` — Cursor extension
  - "Council Review" command in command palette
  - Inline diff suggestions
- [ ] `adapter-claude-code` — Claude Code plugin
  - MCP server for council
  - File-based config

#### Core Improvements

- [ ] Real-time streaming in all platforms
- [ ] Deadlock reports with suggestions
- [ ] Improved proposal revision (actual LLM synthesis)

### Deliverables

| Package | Description | Status |
|---------|------------|--------|
| `@ai-council/core` | Consensus & orchestration engine | ✅ v0.1.0 |
| `@ai-council/cli` | Command-line interface | ✅ v0.1.0 |
| `@ai-council/adapter-opencode` | OpenCode integration | ⏳ v0.2.0 |
| `@ai-council/adapter-cursor` | Cursor integration | ⏳ v0.2.0 |
| `@ai-council/adapter-claude-code` | Claude Code integration | ⏳ v0.2.0 |

---

## v1.0.0 — Production Ready

**Goal:** Stable, feature-complete, enterprise-ready.

**Timeline:** 4-6 weeks

### Scope

#### Core Enhancements

- [ ] Database storage
  - SQLite support
  - PostgreSQL support
- [ ] Agent persistence & learning
  - Remember past decisions
  - Improve categorization over time
- [ ] Performance optimization
  - Parallel agent invocation
  - LLM call batching
- [ ] Observability
  - Prometheus metrics export
  - Structured logging (JSON)
  - Tracing support (OpenTelemetry)

#### Features

- [ ] Custom agent archetypes (user-defined)
- [ ] Plugin system for custom voting rules
- [ ] Consensus analytics dashboard
- [ ] Webhook notifications

#### Integrations

- [ ] GitHub Actions integration
  - PR review with council agents
- [ ] Slack notifications

### Deliverables

| Package | Description | Status |
|---------|------------|--------|
| `@ai-council/core` | Consensus & orchestration engine | ✅ v0.1.0 |
| `@ai-council/cli` | Command-line interface | ✅ v0.1.0 |
| `@ai-council/*` | All adapters | ✅ v0.2.0 |
| Analytics Dashboard | Web UI | ⏳ v1.0.0 |
| GitHub Action | CI/CD integration | ⏳ v1.0.0 |
