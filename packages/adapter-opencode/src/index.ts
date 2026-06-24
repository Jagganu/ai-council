/**
 * AI Council OpenCode Adapter
 *
 * Provides a skill for OpenCode to invoke AI Council deliberation.
 * Usage in OpenCode: /council review <task>
 */

import { AICouncilSDK } from '@ai-council/sdk';

export interface OpenCodeAdapterOptions {
  configPath?: string;
  defaultLLM?: string;
}

export class OpenCodeCouncilAdapter {
  private sdk: AICouncilSDK;

  constructor(options: OpenCodeAdapterOptions = {}) {
    this.sdk = new AICouncilSDK({
      configPath: options.configPath,
    });
  }

  async review(task: string): Promise<string> {
    const result = await this.sdk.review(task);
    return this.formatResponse(result);
  }

  async plan(task: string): Promise<string> {
    const result = await this.sdk.plan(task);
    return this.formatResponse(result);
  }

  private formatResponse(result: any): string {
    let output = '# AI Council Review Results\n\n';

    for (const decision of result.decisions) {
      output += `## ${decision.phase}\n`;
      output += `- Rounds: ${decision.round}\n`;
      output += `- Approved: ${decision.finalApproved ? '✅' : '❌'}\n`;
      output += `- Proposal: ${decision.proposal.substring(0, 200)}...\n\n`;
    }

    const achieved = result.consensusResults.filter((r: any) => r.achieved).length;
    const total = result.consensusResults.length;
    output += `**Consensus: ${achieved}/${total} phases achieved**\n`;

    return output;
  }
}

export const councilSkill = {
  name: 'council',
  description: 'Multi-agent consensus review for development decisions',
  triggers: ['/council', '/council review', '/council plan'],
  execute: async (task: string) => {
    const adapter = new OpenCodeCouncilAdapter();
    if (task.startsWith('plan ')) {
      return adapter.plan(task.substring(5));
    }
    return adapter.review(task);
  },
};

export default councilSkill;