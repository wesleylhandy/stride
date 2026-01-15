/**
 * Server-only utility for project key generation
 * 
 * WARNING: This file imports database dependencies and MUST NOT be used in client components.
 * Use the client-safe inline version in RepositoryImportForm.tsx for client-side key generation.
 */

import { projectRepository } from "@stride/database";

/**
 * Generate a project key from a repository name
 * 
 * Algorithm:
 * 1. Convert to uppercase
 * 2. Remove all non-alphanumeric characters
 * 3. Truncate to 10 characters (project key max length)
 * 4. Ensure minimum 2 characters (project key min length)
 * 
 * @param repoName - Repository name (e.g., "my-awesome-repo", "my_repo")
 * @returns Generated project key (e.g., "MYAWESOMER", "MYREPO")
 */
export function generateProjectKeyFromName(repoName: string): string {
  if (!repoName || repoName.trim().length === 0) {
    throw new Error("Repository name cannot be empty");
  }

  // Convert to uppercase and remove all non-alphanumeric characters
  const cleaned = repoName.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (cleaned.length === 0) {
    throw new Error("Repository name must contain at least one alphanumeric character");
  }

  // Truncate to 10 characters (max project key length)
  let key = cleaned.slice(0, 10);

  // Ensure minimum 2 characters (min project key length)
  // If we have less than 2 characters after cleaning, pad with zeros or use a default
  if (key.length < 2) {
    // If we have at least 1 character, pad with "0" to reach 2
    // Otherwise, use a default key prefix
    key = key.length === 1 ? `${key}0` : "PRJ";
  }

  return key;
}

/**
 * Generate a unique project key from a repository name with conflict resolution
 * 
 * If the generated key conflicts with an existing project, appends a number suffix
 * (e.g., "MYREPO", "MYREPO1", "MYREPO2", ...)
 * 
 * @param repoName - Repository name
 * @param excludeProjectId - Optional project ID to exclude from uniqueness check
 * @returns Promise resolving to a unique project key
 */
export async function generateUniqueProjectKey(
  repoName: string,
  excludeProjectId?: string,
): Promise<string> {
  // Generate base key from repository name
  const baseKey = generateProjectKeyFromName(repoName);

  // Check if base key is available
  const existing = await projectRepository.findByKey(baseKey);

  // If key doesn't exist, or if it exists but matches the excluded project ID, return it
  if (!existing || (excludeProjectId && existing.id === excludeProjectId)) {
    return baseKey;
  }

  // Key conflicts - try appending numbers
  // Reserve last 2 characters for number suffix if needed (to stay within 10 char limit)
  // If baseKey is 10 chars, we need to truncate it to 8 to allow for 2-digit suffix
  const maxSuffixLength = baseKey.length >= 9 ? 1 : 2; // Allow up to 2 digits if there's room
  const keyPrefix = maxSuffixLength === 1 
    ? baseKey.slice(0, 9) // Leave 1 char for suffix
    : baseKey; // Can use full baseKey if it's short enough

  // Try numbers starting from 1
  for (let i = 1; i <= 99; i++) {
    const suffix = i.toString();
    
    // Check if suffix fits within 10 char limit
    const candidateKey = `${keyPrefix}${suffix}`;
    
    // If candidate exceeds 10 chars, truncate prefix to make room
    if (candidateKey.length > 10) {
      const truncateTo = 10 - suffix.length;
      const truncatedPrefix = keyPrefix.slice(0, truncateTo);
      const finalKey = `${truncatedPrefix}${suffix}`;
      
      const existingWithKey = await projectRepository.findByKey(finalKey);
      if (!existingWithKey || (excludeProjectId && existingWithKey.id === excludeProjectId)) {
        return finalKey;
      }
    } else {
      const existingWithKey = await projectRepository.findByKey(candidateKey);
      if (!existingWithKey || (excludeProjectId && existingWithKey.id === excludeProjectId)) {
        return candidateKey;
      }
    }
  }

  // If we've exhausted all possibilities (shouldn't happen in practice),
  // append a random suffix
  const randomSuffix = Math.floor(Math.random() * 1000).toString().slice(-2);
  const fallbackKey = `${keyPrefix}${randomSuffix}`.slice(0, 10);
  
  return fallbackKey;
}
