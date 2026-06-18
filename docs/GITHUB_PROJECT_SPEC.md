# GitHub Project Specification

## Repository Setup

### Repository Name
```
ai-council
```

### Description
```
Multi-agent consensus framework for AI-powered development. Spawn configurable agents 
that deliberate through planning, architecture, and implementation phases with 
democratic voting and streaming consensus.
```

### Topics
```
ai, agents, consensus, llm, opencode, cursor, claude-code, multi-agent, voting
```

### Repository Settings

- **Visibility:** Public
- **Default branch:** main
- **Branch protection rules:**
  - Require pull request reviews before merging (1)
  - Require status checks to pass
  - Require branches to be up to date before merging
  - Include administrators

---

## Milestones

### Milestone: v0.1.0 — MVP Core Engine
**Description:** Foundation: types, core engine, CLI, documentation  
**Due Date:** 6 weeks from start  
**Issues:** ~25-30

```
Core Components:
- LLM Provider Abstraction
- Agent Manager
- Orchestrator State Machine
- Voting Engine (simple majority)
- Session Persistence
- Config System
- CLI (review, plan, config, replay)
- Documentation
- Tests (70% coverage)
```

### Milestone: v0.2.0 — Adapters & Streaming
**Description:** Platform integrations for OpenCode, Cursor, Claude Code  
**Due Date:** 12 weeks from start  
**Issues:** ~20-25

```
Features:
- Adapter SDK
- OpenCode Adapter
- Cursor Adapter
- Claude Code Adapter
- Real-time Streaming
- Deadlock Handling
- Advanced Voting Modes
- Enhanced Documentation
- Adapter Tests
```

### Milestone: v1.0.0 — Production Ready
**Description:** Enterprise features, optimizations, integrations  
**Due Date:** 20 weeks from start  
**Issues:** ~30-40

```
Features:
- Database Storage (SQLite, PostgreSQL)
- Agent Learning & Memory
- Performance Optimization
- Security & Access Control
- GitHub Actions Integration
- Slack/Discord Integration
- Analytics Dashboard
- Local LLM Support
- 90%+ Test Coverage
```

---

## Labels

### Priority
```
priority: critical   🔴 Breaks core functionality
priority: high       🟠 Important, should do soon
priority: medium     🟡 Nice to have
priority: low        🔵 Cosmetic or future consideration
```

### Type
```
type: feature        ✨ New functionality
type: bug            🐛 Something broken
type: docs           📚 Documentation
type: test           🧪 Test coverage
type: chore          🔧 Maintenance, refactoring
type: performance    ⚡ Speed/efficiency
type: security       🔒 Security issue
```

### Status
```
status: backlog      📋 Not started
status: in-progress  🚀 Someone is working on it
status: review       👀 Waiting for review
status: blocked      🚧 Blocked on something else
status: done         ✅ Completed
```

### Component
```
component: core      Core engine
component: cli       CLI tool
component: sdk       Adapter SDK
component: adapter   Platform adapter
component: docs      Documentation
component: tests     Tests
component: config    Configuration
component: voting    Voting engine
```

### Platform
```
platform: opencode   OpenCode specific
platform: cursor     Cursor specific
platform: claude-code Claude Code specific
platform: cli        CLI only
platform: all        All platforms
```

---

## Issue Templates

### Feature Request
```markdown
## Description
Clear description of the feature.

## Use Case
Why is this needed?

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Implementation Notes
Optional: Any technical considerations

## Related Issues
Link to related issues
```

### Bug Report
```markdown
## Description
Clear description of the bug.

## Reproduction Steps
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen?

## Actual Behavior
What actually happened?

## Environment
- OS: [e.g., macOS 14.1]
- Node: [e.g., 18.16.0]
- npm: [e.g., 9.6.4]
- Package version: [e.g., 0.1.0]

## Logs/Screenshots
Any error logs or screenshots?

## Related Issues
Link to related issues
```

### Documentation
```markdown
## What needs documenting?
Clear title and description.

## Intended Audience
Who is this for?

## Content Outline
- [ ] Section 1
- [ ] Section 2
- [ ] Section 3

## References
Links to related docs, issues, PRs
```

---

## Pull Request Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (breaking change? yes/no)
- [ ] New feature (breaking change? yes/no)
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Test improvement

## Related Issues
Closes #(issue number)

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review of own code completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass locally
- [ ] No new warnings generated

## Screenshots (if applicable)
Add screenshots for UI changes.

## Notes
Any additional context?
```

---

## GitHub Actions Workflows

### `.github/workflows/ci.yml` — Continuous Integration

```yaml
name: CI

on: [push, pull_request]

jobs:
  build-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm run test
      
      - name: Coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### `.github/workflows/release.yml` — Release to npm

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20.x
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test
      
      - name: Publish to npm
        run: npm publish --workspaces
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Development Workflow

### Setup
```bash
git clone https://github.com/yourusername/ai-council.git
cd ai-council
npm install
```

### Making Changes
```bash
git checkout -b feature/my-feature
# Make changes
npm run lint
npm run test
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

### Opening PR
1. Go to GitHub
2. Click "Compare & pull request"
3. Fill in template
4. Request review from maintainers
5. Address feedback
6. Merge when approved

### Releasing
```bash
# Update version in package.json files
npm version patch  # or minor/major

# Tag
git tag v0.1.0

# Push
git push origin main --tags

# GitHub Actions will publish to npm automatically
```

---

## Code Review Guidelines

### Reviewers Should Check

- [ ] Code follows project style
- [ ] No breaking changes without discussion
- [ ] Tests cover new functionality
- [ ] Performance not degraded
- [ ] Documentation updated
- [ ] No security issues
- [ ] Comments clear and helpful

### Mergeable Criteria

- [x] All CI checks pass
- [x] At least 1 approval
- [x] No requested changes
- [x] Rebased on main
- [x] No conflicts

---

## Community Guidelines

### Code of Conduct
```
- Be respectful
- Assume good intent
- Welcome diverse perspectives
- Help others learn
- Report issues to maintainers
```

### Contributing
1. Read CONTRIBUTING.md
2. Pick an issue or propose one
3. Discuss approach if significant
4. Submit PR with tests
5. Engage in review process
6. Celebrate when merged!

### Communication Channels
- GitHub Issues: Bug reports, feature requests
- GitHub Discussions: Ideas, questions (if enabled)
- Pull Requests: Code review

---

## Repository Structure (File Level)

```
ai-council/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── release.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── documentation.md
│   └── pull_request_template.md
│
├── packages/
│   ├── core/
│   ├── cli/
│   ├── sdk/
│   ├── adapter-opencode/
│   ├── adapter-cursor/
│   └── adapter-claude-code/
│
├── docs/
│   ├── CONFIGURATION.md
│   ├── ORCHESTRATOR_WORKFLOW.md
│   ├── VOTING_ENGINE.md
│   ├── ADAPTER_SDK.md
│   ├── MVP_ROADMAP.md
│   └── API_REFERENCE.md (future)
│
├── examples/
│   ├── simple-auth.yaml
│   ├── cursor-command.js
│   └── opencode-skill.ts
│
├── tests/
│   └── integration/
│
├── .gitignore
├── .npmrc
├── .eslintrc.json
├── tsconfig.json
├── package.json (root)
├── README.md
├── LICENSE
├── CONTRIBUTING.md
└── CODE_OF_CONDUCT.md
```

---

## Branch Naming Convention

```
feature/description
bugfix/description
docs/description
refactor/description
perf/description
test/description
```

Example:
```
feature/orchestrator-deadlock-detection
bugfix/agent-timeout-issue
docs/opencode-integration-guide
```

---

## Commit Message Convention

Follow Conventional Commits:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(orchestrator): add deadlock detection
fix(voting): handle unanimous mode correctly
docs(readme): add quick-start guide
test(agent): add LLM response parsing tests
perf(consensus): optimize vote evaluation
chore(deps): update dependencies
```

---

## Release Process

1. **Update Version**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Update CHANGELOG**
   - Add entry for new version
   - List features, fixes, breaking changes

3. **Commit & Tag**
   ```bash
   git add .
   git commit -m "chore(release): v0.1.0"
   git tag v0.1.0
   git push origin main --tags
   ```

4. **GitHub Release**
   - Go to Releases
   - Create release from tag
   - Add changelog summary
   - Mark as draft/pre-release if needed
   - Publish

5. **npm Publishing**
   - GitHub Actions handles this automatically
   - Verify on npm.js

---

## Support & Maintenance

### Response Times
- Critical bugs: 24 hours
- High priority: 48 hours
- Medium: 1 week
- Low: Best effort

### Deprecation Policy
- Announce 1 version ahead
- Support for at least 1 year
- Migration guide provided

### LTS (Long-Term Support)
TBD after v1.0.0

---

## Success Metrics (GitHub)

Track these in project settings:

- Contributors: Grow to 10+ active contributors
- Issues: Close 80%+ of issues
- PRs: Average review time < 24 hours
- Stars: Reach 1000+ stars by v1.0
- Releases: Regular bi-weekly updates
- Docs: Maintain 100% doc coverage
