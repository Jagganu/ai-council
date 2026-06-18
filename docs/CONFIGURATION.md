# AI Council Configuration Schema

## Overview

AI Council uses YAML configuration files to define agent pools, voting rules, LLM providers, and storage backends.

## Root Configuration Structure

```yaml
council:
  name: string                    # Optional council name
  description: string             # Optional description
  logLevel: debug|info|warn|error # Default: info

storage:
  mode: memory|file|sqlite|postgres
  path: string                    # For file storage: .council/sessions
  connectionString: string        # For database storage

context:
  mode: full|summarized|latest_only  # Default: summarized
  maxHistoryRounds: number            # Default: 10

memory:
  mode: session|project|global        # Default: session

credentials:
  openaiApiKey: string          # Optional
  anthropicApiKey: string       # Optional
  googleApiKey: string          # Optional
  openrouterApiKey: string      # Optional
  localModelUrl: string         # Optional

agents:
  count: number                 # Number of agents to spawn
  viewpoints:                   # Agent perspectives
    - security
    - performance
    - scalability
    - reliability
    - maintainability
    - simplicity
    - devils_advocate
  
  llmConfigs:                   # Per-agent LLM configuration
    - provider: anthropic|openai|google|openrouter|local
      model: string
      temperature: number       # 0.0-2.0, default 0.7
      maxTokens: number         # Default 2000
  
  defaultLLM:                   # Default for all agents if not specified
    provider: anthropic
    model: claude-sonnet
    temperature: 0.7
    maxTokens: 2000
  
  weights:                      # Weighted voting (optional)
    architect: 3
    security: 4
    reviewer: 2
  
  vetoAgents:                   # Agents with veto power (optional)
    - security
    - compliance

voting:
  mode: simple_majority|supermajority|mandatory_approval|unanimous
  threshold: number             # 0.0-1.0 (for majority modes)
  requiredAgents:               # Agents that must approve (mandatory_approval)
    - security
    - testing
  maxRounds: number             # Default: 15
```

## Complete Example Configuration

### File: `.council/config.yaml`

```yaml
council:
  name: "Development Review Council"
  description: "Multi-agent consensus for development decisions"
  logLevel: info

storage:
  mode: file
  path: .council/sessions

context:
  mode: summarized
  maxHistoryRounds: 10

memory:
  mode: session

credentials:
  anthropicApiKey: ${ANTHROPIC_API_KEY}
  openaiApiKey: ${OPENAI_API_KEY}

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
    temperature: 0.7
    maxTokens: 2000
  
  weights:
    security: 4
    performance: 3
    scalability: 2
    simplicity: 1
  
  vetoAgents:
    - security

voting:
  mode: supermajority
  threshold: 0.75        # 75% required
  maxRounds: 20
```

## Per-Decision Voting Rules

Override voting rules per decision type:

```yaml
voting:
  routine:
    mode: simple_majority
    threshold: 0.51
    maxRounds: 5
  
  architecture:
    mode: supermajority
    threshold: 0.75
    maxRounds: 15
  
  security:
    mode: mandatory_approval
    requiredAgents:
      - security
    maxRounds: 20
  
  deployment:
    mode: unanimous
    maxRounds: 25
```

## Multiple LLM Providers

```yaml
agents:
  count: 5
  
  llmConfigs:
    - provider: anthropic
      model: claude-sonnet
      temperature: 0.7
    
    - provider: openai
      model: gpt-4
      temperature: 0.8
    
    - provider: openrouter
      model: deepseek-v3
      temperature: 0.6
  
  defaultLLM:
    provider: anthropic
    model: claude-sonnet
```

Each agent gets a configuration from the pool.

## Environment Variable Substitution

Use `${VAR_NAME}` syntax:

```yaml
credentials:
  anthropicApiKey: ${ANTHROPIC_API_KEY}
  openaiApiKey: ${OPENAI_API_KEY}
```

## Database Storage

For SQLite:

```yaml
storage:
  mode: sqlite
  path: .council/council.db
```

For PostgreSQL:

```yaml
storage:
  mode: postgres
  connectionString: ${DATABASE_URL}
  # or
  connectionString: postgres://user:pass@localhost:5432/ai_council
```

## Session Configuration

Additional configuration per session:

```yaml
session:
  id: string                    # Unique session ID
  task: string                  # The task being deliberated
  metadata:
    projectId: string
    userId: string
    tags: [string]
  startTime: timestamp
```

## Validation Rules

- `agents.count` must be >= 1
- `voting.threshold` must be 0.0 to 1.0
- `agents.weights` must sum to > 0
- `credentials`: at least one provider must be configured
- `storage.mode` must be valid
- `context.mode` must be valid

## Schema Version

Current version: `1.0`

Future versions will maintain backward compatibility.
