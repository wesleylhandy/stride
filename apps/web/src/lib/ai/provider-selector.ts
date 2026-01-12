// Provider selector for AI triage
// Selects appropriate AI provider and model from configured providers for a project
import { prisma } from '@stride/database';
import { decrypt } from '@/lib/integrations/storage';

export type ProviderType = 'openai' | 'anthropic' | 'google-gemini' | 'ollama';

export interface SelectedProvider {
  providerId: string;
  providerType: ProviderType;
  model: string;
  apiKey?: string; // Decrypted API key for cloud providers
  endpointUrl?: string; // Endpoint URL for self-hosted providers
  authToken?: string; // Decrypted auth token for self-hosted providers (optional)
}

/**
 * Selects an AI provider and model for a project
 * 
 * Selection logic:
 * 1. Find all active providers for the project
 * 2. If multiple providers exist, prefer providers with a default model set
 * 3. Select the first provider with enabled models
 * 4. Use defaultModel if set, otherwise use the first enabled model
 * 
 * @param projectId - Project ID
 * @returns Selected provider and model, or null if no providers configured
 */
export async function selectProviderForProject(
  projectId: string
): Promise<SelectedProvider | null> {
  // Get all active AI providers for the project
  const providers = await prisma.aiProviderConfig.findMany({
    where: {
      projectId,
      isActive: true,
    },
    orderBy: [
      // Prefer providers with defaultModel set (more specific configuration)
      { defaultModel: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  if (providers.length === 0) {
    return null;
  }

  // Find the first provider with enabled models
  for (const provider of providers) {
    const enabledModels = provider.enabledModels as string[] | null;
    
    if (!enabledModels || enabledModels.length === 0) {
      continue;
    }

    // Determine which model to use
    let selectedModel: string;
    
    if (provider.defaultModel && enabledModels.includes(provider.defaultModel)) {
      // Use default model if it's in the enabled models list
      selectedModel = provider.defaultModel;
    } else {
      // Otherwise, use the first enabled model
      selectedModel = enabledModels[0]!;
    }

    // Build selected provider result
    const selected: SelectedProvider = {
      providerId: provider.id,
      providerType: provider.providerType as ProviderType,
      model: selectedModel,
    };

    // Decrypt and include credentials if available
    if (provider.apiKey) {
      try {
        selected.apiKey = decrypt(provider.apiKey);
      } catch (error) {
        console.error(`Failed to decrypt API key for provider ${provider.id}:`, error);
        // Skip this provider if decryption fails
        continue;
      }
    }

    if (provider.endpointUrl) {
      selected.endpointUrl = provider.endpointUrl;
    }

    if (provider.authToken) {
      try {
        selected.authToken = decrypt(provider.authToken);
      } catch (error) {
        console.error(`Failed to decrypt auth token for provider ${provider.id}:`, error);
        // Auth token is optional, so continue even if decryption fails
      }
    }

    return selected;
  }

  // No providers with enabled models found
  return null;
}

/**
 * Gets all configured providers with enabled models for a project
 * Useful for displaying available options or selection UI
 * 
 * @param projectId - Project ID
 * @returns Array of providers with their enabled models (without sensitive data)
 */
export async function getAvailableProviders(
  projectId: string
): Promise<Array<{
  providerId: string;
  providerType: ProviderType;
  enabledModels: string[];
  defaultModel: string | null;
}>> {
  const providers = await prisma.aiProviderConfig.findMany({
    where: {
      projectId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return providers
    .filter((provider) => {
      const enabledModels = provider.enabledModels as string[] | null;
      return enabledModels && enabledModels.length > 0;
    })
    .map((provider) => ({
      providerId: provider.id,
      providerType: provider.providerType as ProviderType,
      enabledModels: provider.enabledModels as string[],
      defaultModel: provider.defaultModel,
    }));
}
