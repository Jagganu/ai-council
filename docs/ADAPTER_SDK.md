# Adapter SDK Specification

## Overview

Adapters are plugin bridges that connect the AI Council core to different platforms (OpenCode, Cursor, Claude Code, CLI, etc.).

Each adapter implements the `IAdapterPlugin` interface and handles platform-specific I/O.

## Core Adapter Interface

```typescript
export interface IAdapterPlugin {
  // Platform identifier
  name: string;              // "opencode", "cursor", "claude-code", "cli"
  version: string;
  
  // Lifecycle
  initialize(config: AdapterConfig): Promise<void>;
  shutdown(): Promise<void>;
  
  // Input/Output
  requestUserInput(prompt: string): Promise<string>;
  displayMessage(message: string, type?: MessageType): Promise<void>;
  displayAgentResponse(response: AgentMessage): Promise<void>;
  displayVotingResult(result: ConsensusResult): Promise<void>;
  
  // Streaming (real-time deliberation display)
  streamAgentThinking(agentId: string, thinking: string): Promise<void>;
  streamVotingProgress(result: ConsensusResult): Promise<void>;
  
  // File handling
  getConfigPath(): string;
  saveSession(session: OrchestratorState): Promise<void>;
  loadSession(sessionId: string): Promise<OrchestratorState | null>;
}

export interface AdapterConfig {
  platformName: string;
  orchestratorConfig: OrchestratorConfig;
  outputFormat?: 'text' | 'json' | 'markdown';
  streamingEnabled?: boolean;
  logPath?: string;
}

export enum MessageType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface AgentMessage {
  agentId: string;
  agentName: string;
  viewpoint: string;
  message: string;
  isThinking?: boolean; // for streaming
}
```

## SDK Export

Each adapter package exports:

```typescript
// packages/adapter-{platform}/src/index.ts

export { CouncilAdapter } from './CouncilAdapter';
export { AdapterConfig } from './types';
export { createAdapter } from './factory';

// Factory function for easy instantiation
export async function createAdapter(
  config: AdapterConfig
): Promise<IAdapterPlugin> {
  return new CouncilAdapter(config);
}
```

## Example: OpenCode Adapter

### Architecture

```
OpenCode Plugin
  │
  ├─ Slash Command: /council review
  │  └─ Triggers CouncilSkill
  │
  ├─ CouncilSkill (OpenCode Skill)
  │  └─ Uses CouncilAdapter
  │
  └─ CouncilAdapter (SDK)
     └─ Calls @ai-council/core
```

### Implementation Pattern

```typescript
// packages/adapter-opencode/src/CouncilAdapter.ts

import { IAdapterPlugin, MessageType, AgentMessage, AdapterConfig } from './types';
import { Orchestrator, OrchestratorConfig } from '@ai-council/core';

export class CouncilAdapter implements IAdapterPlugin {
  name = 'opencode';
  version = '0.1.0';
  
  private orchestrator: Orchestrator;
  private config: AdapterConfig;
  
  constructor(config: AdapterConfig) {
    this.config = config;
  }
  
  async initialize(config: AdapterConfig): Promise<void> {
    this.config = config;
    
    // Initialize orchestrator with core config
    this.orchestrator = new Orchestrator();
    await this.orchestrator.initialize(
      config.orchestratorConfig,
      {
        sessionId: generateSessionId(),
        task: '',
        startTime: new Date(),
        orchestratorConfig: config.orchestratorConfig,
      }
    );
  }
  
  async shutdown(): Promise<void> {
    // Cleanup resources
  }
  
  async requestUserInput(prompt: string): Promise<string> {
    // OpenCode: Show prompt in panel, wait for user response
    return await opencode.requestUserInput(prompt);
  }
  
  async displayMessage(message: string, type = MessageType.INFO): Promise<void> {
    // OpenCode: Display message in panel with type styling
    opencode.panel.append({
      type: 'message',
      content: message,
      messageType: type,
      timestamp: new Date(),
    });
  }
  
  async displayAgentResponse(response: AgentMessage): Promise<void> {
    const formattedMessage = formatAgentResponse(response);
    await this.displayMessage(formattedMessage, MessageType.INFO);
  }
  
  async displayVotingResult(result: ConsensusResult): Promise<void> {
    const summary = `
🗳️ Voting Round ${result.round}
Approved: ${result.approvingAgents.length}
Rejected: ${result.rejectingAgents.length}
Status: ${result.achieved ? '✅ CONSENSUS' : '❌ NEEDS REVISION'}
    `.trim();
    
    await this.displayMessage(summary, 
      result.achieved ? MessageType.SUCCESS : MessageType.WARNING
    );
  }
  
  async streamAgentThinking(agentId: string, thinking: string): Promise<void> {
    // Stream in real-time as agent responds
    opencode.panel.stream({
      agentId,
      content: thinking,
      isThinking: true,
    });
  }
  
  async streamVotingProgress(result: ConsensusResult): Promise<void> {
    opencode.panel.stream({
      type: 'voting',
      content: `Consensus: ${Math.round(result.weightedScore * 100)}%`,
    });
  }
  
  getConfigPath(): string {
    return './.council/config.yaml';
  }
  
  async saveSession(session: OrchestratorState): Promise<void> {
    const path = `./.council/sessions/${session.sessionId}.json`;
    await fs.writeFile(path, JSON.stringify(session, null, 2));
  }
  
  async loadSession(sessionId: string): Promise<OrchestratorState | null> {
    try {
      const path = `./.council/sessions/${sessionId}.json`;
      const data = await fs.readFile(path, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
```

### OpenCode Skill Integration

```typescript
// packages/adapter-opencode/src/CouncilSkill.ts

import { Skill } from '@opencode/sdk';
import { CouncilAdapter } from './CouncilAdapter';

export class CouncilSkill extends Skill {
  name = 'Council';
  description = 'Multi-agent consensus for development decisions';
  
  private adapter: CouncilAdapter;
  
  async onInit() {
    this.adapter = new CouncilAdapter({
      platformName: 'opencode',
      orchestratorConfig: await loadOrchestratorConfig(),
    });
    
    await this.adapter.initialize(this.config);
  }
  
  async slashCommand_review(context: SkillContext) {
    const task = context.args.join(' ') || 'Review current code';
    
    await this.adapter.displayMessage(
      `🤔 Starting council review for: "${task}"`
    );
    
    const result = await this.adapter.orchestrator.processTask(task);
    
    // Display results
    await this.adapter.displayMessage(JSON.stringify(result, null, 2));
  }
  
  async slashCommand_replay(context: SkillContext) {
    const sessionId = context.args[0];
    const session = await this.adapter.loadSession(sessionId);
    
    if (!session) {
      await this.adapter.displayMessage('Session not found', MessageType.ERROR);
      return;
    }
    
    // Replay deliberation
    for (const entry of session.sessionLog) {
      await this.adapter.displayMessage(formatLogEntry(entry));
      await sleep(500); // Animated replay
    }
  }
}
```

## Example: Cursor Adapter

### Pattern

```typescript
// packages/adapter-cursor/src/CouncilAdapter.ts

export class CursorAdapter implements IAdapterPlugin {
  name = 'cursor';
  
  async displayAgentResponse(response: AgentMessage): Promise<void> {
    // Cursor: Write to chat output
    cursor.chat.write(`
## ${response.agentName} (${response.viewpoint})

${response.message}
    `);
  }
  
  async streamAgentThinking(agentId: string, thinking: string): Promise<void> {
    // Stream chunk by chunk in Cursor's chat
    cursor.chat.streamChunk(thinking);
  }
}
```

### Cursor Command

```typescript
// Extension command: "council.review"

async function reviewWithCouncil() {
  const adapter = new CursorAdapter({
    platformName: 'cursor',
    orchestratorConfig: config,
  });
  
  const editor = vscode.window.activeTextEditor;
  const selectedText = editor?.document.getText(editor.selection);
  
  const result = await adapter.orchestrator.processTask(
    `Review this code:\n${selectedText}`
  );
  
  // Output to panel
}
```

## Example: Claude Code Adapter

### Pattern

```typescript
// packages/adapter-claude-code/src/CouncilAdapter.ts

export class ClaudeCodeAdapter implements IAdapterPlugin {
  name = 'claude-code';
  
  async displayAgentResponse(response: AgentMessage): Promise<void> {
    // Claude Code: Use markdown in response
    return `
### ${response.agentName}
**Viewpoint:** ${response.viewpoint}

${response.message}
    `;
  }
  
  async displayVotingResult(result: ConsensusResult): Promise<void> {
    const status = result.achieved ? '✅' : '⚠️';
    return `
${status} **Round ${result.round}:** ${Math.round(result.weightedScore * 100)}% consensus
    `;
  }
}
```

## Example: CLI Adapter

### Pattern

```typescript
// packages/cli/src/CliAdapter.ts

export class CliAdapter implements IAdapterPlugin {
  name = 'cli';
  
  async displayAgentResponse(response: AgentMessage): Promise<void> {
    console.log(`
┌─ ${response.agentName} (${response.viewpoint})
│
├ ${response.message.split('\n').join('\n│ ')}
└
    `);
  }
  
  async displayVotingResult(result: ConsensusResult): Promise<void> {
    const bar = generateProgressBar(result.weightedScore);
    console.log(`
Round ${result.round}: ${bar} ${Math.round(result.weightedScore * 100)}%
    `);
  }
}
```

## Adapter Responsibilities Matrix

| Task | Adapter | Core |
|------|---------|------|
| User input | ✓ | |
| Display messages | ✓ | |
| Stream output | ✓ | |
| Load config | ✓ | ✓ |
| Spawn agents | | ✓ |
| LLM calls | | ✓ |
| Consensus logic | | ✓ |
| Save sessions | ✓ | |
| Log events | | ✓ |

## Configuration at Adapter Level

```yaml
# .council/config.opencode.yaml
adapter:
  streaming: true
  outputFormat: markdown
  panel:
    autoScroll: true
    timestamps: true

core:
  agents:
    count: 4
  voting:
    mode: supermajority
```

## Testing Adapters

```typescript
// packages/adapter-opencode/tests/CouncilAdapter.test.ts

describe('CouncilAdapter', () => {
  let adapter: CouncilAdapter;
  
  beforeEach(async () => {
    adapter = new CouncilAdapter(mockConfig);
    await adapter.initialize(mockConfig);
  });
  
  it('should display agent responses', async () => {
    const response: AgentMessage = {
      agentId: 'security',
      agentName: 'Security Agent',
      viewpoint: 'security',
      message: 'Add CSRF protection',
    };
    
    await adapter.displayAgentResponse(response);
    expect(mockPlatform.displayed).toContain('Security Agent');
  });
  
  it('should stream voting progress', async () => {
    const result = mockConsensusResult;
    await adapter.streamVotingProgress(result);
    expect(mockPlatform.streamed).toBeTruthy();
  });
});
```

## Summary

- **Each adapter** is ~500-1000 LOC
- **Each platform** has one adapter
- **Adapters are stateless** (state lives in core)
- **Adapters handle I/O only** (no business logic)
- **Easy to add new platforms** by creating new adapter

Adding a new platform requires:
1. Create `packages/adapter-{platform}`
2. Implement `IAdapterPlugin`
3. Add package.json
4. ~10-15 lines of registration code in CLI
