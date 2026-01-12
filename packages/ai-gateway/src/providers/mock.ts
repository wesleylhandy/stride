// Mock provider for development
import type { ProviderClient } from '../lib/provider-selector';

export function createMockProvider(): ProviderClient {
  return {
    async createCompletion() {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Return mock response matching expected format
      return JSON.stringify({
        summary: 'Mock analysis: This appears to be a typical issue that requires investigation. The error context suggests a potential root cause in the authentication flow.',
        priority: 'medium',
        suggestedAssignee: 'A backend developer familiar with authentication systems would be best suited to investigate this issue.',
      });
    },
  };
}
