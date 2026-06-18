# Contributing to AI Council

Thank you for your interest in contributing! We welcome developers, docs writers, designers, and testers.

## Code of Conduct

- Be respectful and inclusive
- Assume good intent
- Welcome diverse perspectives
- Help others learn
- Report issues to maintainers

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Git
- Anthropic or OpenAI API key (for testing)

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/ai-council.git
cd ai-council

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### Project Structure

```
packages/
├── core/          Core consensus engine (start here)
├── cli/           CLI commands
├── sdk/           Adapter SDK
└── adapter-*/     Platform integrations
```

### Making Your First Contribution

1. **Pick an issue**
   - Look for `good-first-issue` or `help-wanted` labels
   - Check issues labeled with v0.1 milestone
   - Ask in the issue if you're interested

2. **Discuss the approach**
   - For large features, open an issue first
   - Get feedback before coding

3. **Create a branch**
   ```bash
   git checkout -b feature/description
   # or
   git checkout -b bugfix/description
   ```

4. **Make your changes**
   - Follow code style (see below)
   - Add tests
   - Update docs if needed

5. **Test locally**
   ```bash
   npm run lint
   npm run build
   npm test
   ```

6. **Commit with clear messages**
   ```bash
   git add .
   git commit -m "feat(core): add deadlock detection"
   ```

7. **Push and create PR**
   ```bash
   git push origin feature/description
   ```
   Go to GitHub, click "Compare & pull request"

8. **Respond to feedback**
   - Address review comments
   - Commit changes (don't force push in review)
   - Update PR description if scope changes

## Code Style

### TypeScript
```typescript
// Use strict mode
"strict": true

// Prefer const over let
const x = 1;

// Use interfaces, not types (usually)
interface Agent {
  id: string;
  invoke(): Promise<void>;
}

// Clear, descriptive names
const agentResponses = await Promise.all(agents.map(a => a.invoke()));

// Document complex logic
/** Evaluate consensus using weighted voting */
function evaluateConsensus(votes: Vote[]): ConsensusResult {
  // ponytail: weighted voting, upgrade to hierarchical if needed
  ...
}

// Add JSDoc for public functions
/**
 * Run a consensus round for a decision
 * @param decisionId - The decision being voted on
 * @returns ConsensusResult with vote breakdown
 */
export async function runConsensusRound(decisionId: string): Promise<ConsensusResult> {
  ...
}
```

### File Organization
```typescript
// 1. Imports
import { Type } from './types';

// 2. Interfaces/Types
interface MyInterface {
  ...
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Classes/Functions
export class MyClass {
  ...
}

// 5. Exports
export { MyClass };
```

### Linting
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint --fix
```

## Testing

### Writing Tests

```typescript
// test/voting.test.ts
import { VotingEngine } from '../src/voting/VotingEngine';

describe('VotingEngine', () => {
  let engine: VotingEngine;
  
  beforeEach(() => {
    engine = new VotingEngine();
  });
  
  it('should evaluate simple majority correctly', () => {
    const votes: Vote[] = [
      { agentId: 'a1', voteType: VoteType.APPROVE, ... },
      { agentId: 'a2', voteType: VoteType.APPROVE, ... },
      { agentId: 'a3', voteType: VoteType.REJECT, ... },
    ];
    
    const result = engine.evaluate(votes, {
      mode: ConsensusMode.SIMPLE_MAJORITY,
    });
    
    expect(result.achieved).toBe(true);
    expect(result.weightedScore).toBeCloseTo(0.666, 2);
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific package
npm test -w @ai-council/core

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Coverage Requirements
- New features: 80%+ coverage
- Bug fixes: 100% coverage for the fix
- Refactoring: Maintain or improve coverage

## Documentation

### Updating Docs

```bash
# Edit files in docs/
docs/
├── CONFIGURATION.md           Config schema
├── ORCHESTRATOR_WORKFLOW.md   How it works
├── VOTING_ENGINE.md           Voting rules
├── ADAPTER_SDK.md             Building adapters
└── etc.
```

### Style Guide
- Use clear, short sentences
- Link to relevant sections
- Include code examples
- Use tables for comparisons
- Add diagrams for complex flows (ASCII art OK)

### Example Documentation
```markdown
# Feature: Deadlock Handling

## When Deadlock Occurs

Deadlock happens after `maxRounds` without consensus.

## Example

Given config:
```yaml
voting:
  maxRounds: 15
```

After 15 rounds without 75% consensus → deadlock.

## Deadlock Report

```json
{
  "decisionId": "decision-001",
  "rounds": 15,
  "agreeingAgents": ["agent-a", "agent-b"],
  "disagreeingAgents": ["agent-c", "agent-d"],
  "objections": {
    "agent-c": "Performance concerns",
    "agent-d": "Scalability limits"
  }
}
```

## What to Do

1. Review objections
2. Manually revise proposal
3. Run new consensus round (or give up)
```

## Pull Request Process

### Before Submitting
- [ ] Fork the repo
- [ ] Create feature branch
- [ ] Make your changes
- [ ] Run `npm run lint`
- [ ] Run `npm test`
- [ ] Run `npm run build`
- [ ] Update README if needed

### PR Title
Follow conventional commits:
```
feat(core): add agent weighting
fix(cli): handle missing config file
docs(readme): add quick-start section
test(voting): improve coverage to 95%
```

### PR Description
```markdown
## Description
Brief description of changes.

## Motivation
Why is this needed?

## Testing
How did you test this?

## Checklist
- [ ] Builds successfully
- [ ] Tests pass (90%+ coverage)
- [ ] No linting errors
- [ ] Docs updated
- [ ] No breaking changes (or discussed)
```

### Review Process
- Maintainers review within 24-48 hours
- Address feedback in new commits (don't squash yet)
- Once approved, maintainers will squash & merge

## Commit Messages

Follow Conventional Commits:

```
type(scope): subject

[optional body explaining why]

[optional footer with issue reference]
```

### Types
```
feat     New feature
fix      Bug fix
docs     Documentation
test     Tests
refactor Code refactoring
perf     Performance improvement
chore    Maintenance, deps
```

### Examples
```
feat(core): implement weighted voting system
fix(voting): handle tie-breaking in supermajority
docs(adapter-sdk): add OpenCode integration guide
test(orchestrator): add phase transition tests
perf(consensus): cache agent viewpoint prompts
```

## Development Workflow

### Typical Day

```bash
# 1. Update main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes
# Edit files...

# 4. Run tests & lint
npm run lint --fix
npm test

# 5. Commit
git add .
git commit -m "feat(core): add X feature"

# 6. Push
git push origin feature/my-feature

# 7. Open PR on GitHub
```

### Running Specific Tests

```bash
# Test specific file
npm test -- src/voting/VotingEngine.test.ts

# Test with pattern
npm test -- --testNamePattern="majority"

# Test with coverage
npm test -- --coverage src/voting/
```

## Areas to Contribute

### Code
- **Easy:** Add tests, improve error handling, optimize performance
- **Medium:** Implement new voting modes, add agent types
- **Hard:** Multi-agent negotiation, learning algorithms, local LLM support

### Documentation
- **Easy:** Fix typos, improve examples, clarify confusing sections
- **Medium:** Add tutorials, API reference, configuration guide
- **Hard:** Video tutorials, architecture deep-dive, case studies

### Community
- **Easy:** Answer questions, help in discussions
- **Medium:** Write blog posts, create examples
- **Hard:** Build integrations (Discord, Slack, GitHub Actions)

## Getting Help

- 🙋 **Questions?** Open a discussion on GitHub
- 🐛 **Found a bug?** Create an issue with reproduction steps
- 💡 **Have an idea?** Discuss in issues before coding
- 🤝 **Need guidance?** Tag `@maintainers` in comments

## Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Featured on website (future)
- Eligible for maintainer role (if consistent)

## License

By contributing, you agree your code will be licensed under MIT.

---

Thank you for contributing to AI Council! 🎉

**[⬆ back to top](#contributing-to-ai-council)**
