# AI Council

> Multi-agent consensus framework for AI-powered development. Spawn configurable agents that deliberate through planning, architecture, and implementation phases with democratic voting and streaming consensus.

## What is AI Council?

AI Council lets you harness multiple AI agents with different perspectives to make better development decisions. Instead of a single AI response, you get:

- **4+ agents** with different viewpoints (security, performance, scalability, etc.)
- **4-phase deliberation**: Planning → Architecture → Implementation → Testing & Debugging
- **Democratic voting**: Simple majority, supermajority, unanimous, or mandatory approvals
- **Real-time streaming**: Watch agents debate in your editor/tool
- **Full consensus trails**: Replay and learn from past decisions
- **Works everywhere**: OpenCode, Cursor, Claude Code, GitHub Actions, or standalone CLI

### Example

```bash
council review "Build a user authentication system"
```

Output:
```
🏗️  PLANNING PHASE
┌─ Architect: Propose JWT with refresh tokens
├─ Security: Add CSRF protection too
├─ Performance: Cache user permissions
└─ Simplicity: Keep it straightforward

Round 1: 75% consensus → APPROVED ✅

🏛️  ARCHITECTURE PHASE
┌─ Security: Rate limiting on endpoints
├─ Architect: Database schema for sessions
├─ Performance: Redis cache for tokens
└─ Reliability: Graceful fallback if Redis fails

Round 1: 50% consensus → NEEDS REVISION
Synthesizing objections...

Round 2: 100% consensus → APPROVED ✅

💻 IMPLEMENTATION PHASE
...
```

---

## Quick Start

### Installation

```bash
# Global CLI
npm install -g ai-council

# Or in project
npm install @ai-council/core @ai-council/cli
```

### Setup

```bash
# Initialize council config in current directory
council init

# Follow the interactive wizard
# Answers: agent count, LLM provider, voting rules, etc.

# This creates .council/config.yaml
```

### First Deliberation

```bash
# Run a deliberation
council review "Build a REST API for user profiles"

# View the full session log
cat .council/sessions/session-*.json | jq

# Replay a past deliberation
council replay session-001
```

---

## Use Cases

### 1. Code Review with Multiple Perspectives
```bash
council review < main.ts
```
Agents analyze from security, performance, maintainability angles.

### 2. Architecture Decisions
```bash
council plan "Migrate from monolith to microservices"
```
Debate pros/cons before committing.

### 3. Pre-Production Checklist
```bash
council review-deployment "Deploy to production"
```
All agents must approve (unanimous voting).

### 4. Integration with Your Workflow

**In OpenCode:**
```
/council review selected-code
```

**In Cursor:**
```
CTRL+SHIFT+P → Council: Review Code
```

**In Claude Code:**
```
@council review this code
```

---

## Configuration

Create `.council/config.yaml`:

```yaml
agents:
  count: 4
  viewpoints:
    - security
    - performance
    - scalability
    - simplicity
  defaultLLM:
    provider: anthropic
    model: claude-sonnet

credentials:
  anthropicApiKey: ${ANTHROPIC_API_KEY}
  openaiApiKey: ${OPENAI_API_KEY}

voting:
  mode: supermajority
  threshold: 0.75
  maxRounds: 15

storage:
  mode: file
  path: .council/sessions

context:
  mode: summarized
```

See [CONFIGURATION.md](./docs/CONFIGURATION.md) for full reference.

---

## How It Works

### Three-Phase Deliberation

**1. Planning**
- Agents review the task
- Propose initial approach
- Vote on direction
- Revise until consensus

**2. Architecture**
- Design system structure
- Debate trade-offs
- Technical deep-dive
- Vote on architecture

**3. Implementation**
- Detail code structure
- Implementation plan
- Final approval
- Generate deliverables

### Voting Rules

- **Simple Majority** (50%+1): Fast iteration
- **Supermajority** (66-75%): Balanced
- **Mandatory Approval**: Security-critical decisions
- **Unanimous**: Production deployments

Agents can have **weights** (security matters more) and **veto power**.

See [VOTING_ENGINE.md](./docs/VOTING_ENGINE.md) for details.

---

## Documentation

- [**CONFIGURATION.md**](./docs/CONFIGURATION.md) — Config schema & examples
- [**ORCHESTRATOR_WORKFLOW.md**](./docs/ORCHESTRATOR_WORKFLOW.md) — How the engine works
- [**VOTING_ENGINE.md**](./docs/VOTING_ENGINE.md) — Voting & consensus logic
- [**ADAPTER_SDK.md**](./docs/ADAPTER_SDK.md) — Build custom adapters
- [**MVP_ROADMAP.md**](./docs/MVP_ROADMAP.md) — v0.1 → v1.0 timeline
- [**GITHUB_PROJECT_SPEC.md**](./docs/GITHUB_PROJECT_SPEC.md) — Repo structure

---

## Integrations

### Available (v0.1+)
- ✅ CLI (`council` command)
- ✅ SDK (programmatic API)

### Available (v0.1+)
- ✅ CLI (`council` command)
- ✅ SDK (`@ai-council/sdk` - programmatic API)
- ✅ OpenCode (`@ai-council/adapter-opencode`)
- ✅ Cursor (`@ai-council/adapter-cursor`)
- ✅ Claude Code (`@ai-council/adapter-claude-code`)
- ✅ GitHub Actions (`.github/workflows/council-review.yml`)
- ✅ Slack notifications (`SlackNotifier` class)
- ✅ Local LLM support (Ollama, LM Studio)

---

## Architecture

```
ai-council/
├── packages/core              Core consensus engine
├── packages/cli               Command-line interface
├── packages/sdk               Adapter SDK
├── packages/adapter-*         Platform integrations
└── docs/                      Full documentation
```

### Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js 18+
- **Package Manager:** npm (workspaces)
- **Testing:** Jest
- **LLMs:** Anthropic, OpenAI, Google, OpenRouter, Local

---

## Contributing

We welcome contributors! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code style
- Testing requirements
- PR process

### Good First Issues
Look for issues tagged `good-first-issue` or `help-wanted`.

### Development

```bash
# Clone
git clone https://github.com/Jagganu/ai-council.git
cd ai-council

# Install & build
npm install
npm run build

# Test
npm test

# Create feature branch
git checkout -b feature/my-feature
```

---

## Roadmap

| Version | Timeline | Focus |
|---------|----------|-------|
| **v0.1** | 4-6 weeks | Core engine, CLI, docs |
| **v0.2** | 4-6 weeks | Adapters (OpenCode, Cursor, Claude Code) |
| **v1.0** | 4-6 weeks | Production-ready, analytics, integrations |

See [MVP_ROADMAP.md](./docs/MVP_ROADMAP.md) for detailed breakdown.

---

## Pricing & License

- **License:** MIT (open-source)
- **Cost:** Free for all use cases
- **Hosting:** Run locally or self-host
- **Commercial Support:** Available (details TBD)

---

## Examples

### Example 1: Simple Review
```bash
council review "Is this pagination efficient?"
```

### Example 2: With Custom Viewpoints
Create `.council/config.yaml`:
```yaml
agents:
  count: 5
  viewpoints:
    - security
    - performance
    - cost
    - user_experience
    - maintainability
```

Then:
```bash
council review "Should we use database replication?"
```

### Example 3: Programmatic API
```typescript
import { Orchestrator } from '@ai-council/core';
import { loadConfig } from '@ai-council/cli';

const config = await loadConfig('./.council/config.yaml');
const orchestrator = new Orchestrator();

await orchestrator.initialize(config, {
  sessionId: 'my-session',
  task: 'Design the payment system',
  startTime: new Date(),
  orchestratorConfig: config,
});

const result = await orchestrator.processTask('Design the payment system');
console.log(result);
```

---

## FAQ

**Q: Can I use multiple LLM providers?**  
A: Yes! Configure different agents with different providers in `config.yaml`.

**Q: Does this replace human code review?**  
A: No, it complements it. Use agents for initial feedback, human reviewers for final approval.

**Q: How much do the API calls cost?**  
A: Depends on your LLM provider. Estimate: $0.01-0.05 per deliberation with 4 agents.

**Q: Can agents learn from past decisions?**  
A: In v0.1, agents have no memory between sessions. v1.0 will add persistent learning.

**Q: Is this production-ready?**  
A: v0.1 is MVP quality. v1.0 will be production-ready with security audit.

---

## Support

- 🐛 **Bug reports:** [GitHub Issues](https://github.com/yourusername/ai-council/issues)
- 💡 **Feature ideas:** [GitHub Discussions](https://github.com/yourusername/ai-council/discussions)
- 📧 **Email:** jaganmanyou@gmail.com
- 💬 **Community:** Discord/Slack (coming soon)

---

## Star History

⭐ Star us on GitHub if you find AI Council useful!

---

## License

MIT © 2024 AI Council Contributors

---

## Acknowledgments

Inspired by:
- Multi-agent systems research
- OpenAI's function calling
- Anthropic's constitution AI
- Democratic decision-making processes

---

**[⬆ back to top](#ai-council)**
