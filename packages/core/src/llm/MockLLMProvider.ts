/**
 * Mock LLM Provider for testing - no API calls needed
 */

import { LLMProvider, LLMResponse } from './LLMProvider';

export class MockLLMProvider extends LLMProvider {
  async invoke(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    // ponytail: minimal mock, returns valid JSON for all queries
    const mockResponses = [
      {
        opinion: 'This approach looks solid overall. Good use of standard patterns.',
        agreedWithProposal: true,
        suggestions: ['Add error handling', 'Consider edge cases'],
      },
      {
        opinion: 'Reasonable but could be optimized further.',
        agreedWithProposal: true,
        suggestions: ['Use caching', 'Batch operations'],
      },
      {
        opinion: 'Concerns about complexity and maintainability here.',
        agreedWithProposal: false,
        reasonIfDisagreed: 'Over-engineered for current requirements',
        suggestions: ['Simplify approach', 'Start minimal'],
      },
      {
        opinion: 'Works as specified with acceptable trade-offs.',
        agreedWithProposal: true,
        suggestions: ['Document assumptions', 'Plan for scaling'],
      },
    ];

    // Select different responses per call for variety
    const idx = Math.floor(Math.random() * mockResponses.length);
    const response = mockResponses[idx];

    return {
      content: JSON.stringify(response),
    };
  }
}

