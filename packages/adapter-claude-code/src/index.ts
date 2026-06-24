/**
 * AI Council Claude Code Adapter
 *
 * Claude Code plugin integration via MCP (Model Context Protocol).
 * Provides council deliberation as a Claude Code tool.
 */

import { AICouncilSDK } from '@ai-council/sdk';

export interface ClaudeCodeAdapterOptions {
  configPath?: string;
}

export class ClaudeCodeCouncilAdapter {
  private sdk: AICouncilSDK;

  constructor(options: ClaudeCodeAdapterOptions = {}) {
    this.sdk = new AICouncilSDK({
      configPath: options.configPath,
    });
  }

  async review(task: string): Promise<string> {
    const result = await this.sdk.review(task);
    return this.formatResults(result);
  }

  async plan(task: string): Promise<string> {
    const result = await this.sdk.plan(task);
    return this.formatResults(result);
  }

  private formatResults(result: any): string {
    let output = '# AI Council Review\n\n';

    for (const decision of result.decisions) {
      output += `## ${decision.phase}\n`;
      output += `- **Rounds:** ${decision.round}\n`;
      output += `- **Approved:** ${decision.finalApproved ? '✅' : '❌'}\n\n`;
    }

    const achieved = result.consensusResults.filter((r: any) => r.achieved).length;
    const total = result.consensusResults.length;
    output += `**Consensus:** ${achieved}/${total} phases achieved\n`;

    return output;
  }
}

export const COUNCIL_TOOLS = [
  {
    name: 'council_review',
    description:
      'Run AI Council multi-agent review on a development task. ' +
      'Gets input from security, performance, scalability, and simplicity perspectives.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task or code change to review',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'council_plan',
    description: 'Run AI Council planning phase for a task.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task to plan',
        },
      },
      required: ['task'],
    },
  },
];

export const MCP_SERVER = {
  name: 'ai-council',
  version: '0.1.0',
  description: 'AI Council multi-agent consensus for development decisions',
  tools: COUNCIL_TOOLS,
};

export default { ClaudeCodeCouncilAdapter, tools: COUNCIL_TOOLS, server: MCP_SERVER };