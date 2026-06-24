/**
 * AI Council Cursor Adapter
 *
 * Cursor extension integration for AI Council.
 * Adds "Council Review" command to Cursor's command palette.
 */

import { AICouncilSDK } from '@ai-council/sdk';

export interface CursorAdapterOptions {
  configPath?: string;
  streaming?: boolean;
}

export class CursorCouncilAdapter {
  private sdk: AICouncilSDK;
  private streaming: boolean;

  constructor(options: CursorAdapterOptions = {}) {
    this.sdk = new AICouncilSDK({
      configPath: options.configPath,
    });
    this.streaming = options.streaming ?? true;
  }

  async review(task: string): Promise<void> {
    console.log('[Council] Starting review for:', task);

    const result = await this.sdk.review(task);

    this.displayResults(result);
  }

  private displayResults(result: any): void {
    console.log('\n# AI Council Review Results\n');

    for (const decision of result.decisions) {
      console.log(`## ${decision.phase.toUpperCase()}`);
      console.log(`  Rounds: ${decision.round}`);
      console.log(`  Approved: ${decision.finalApproved ? '✅' : '❌'}`);
      console.log('');
    }

    const achieved = result.consensusResults.filter((r: any) => r.achieved).length;
    const total = result.consensusResults.length;
    console.log(`Consensus: ${achieved}/${total} phases achieved\n`);
  }
}

export const COUNCIL_COMMANDS = {
  id: 'council.review',
  title: 'Council: Review Code',
  category: 'Council',
};

export const COUNCIL_VIEWS = {
  councilPanel: {
    id: 'council.panel',
    title: 'AI Council',
  },
};

export function activate(): void {
  console.log('[Council] Extension activated');
}

export function deactivate(): void {
  console.log('[Council] Extension deactivated');
}

export default { activate, deactivate, commands: COUNCIL_COMMANDS, views: COUNCIL_VIEWS };