/**
 * OAuth State Parameter Encoding/Decoding
 * 
 * Encodes project context (projectId, returnTo, repositoryType, repositoryUrl) 
 * into OAuth state parameter for use with global callback endpoint.
 */

export interface OAuthState {
  projectId: string;
  returnTo?: string;
  repositoryType?: 'GitHub' | 'GitLab';
  repositoryUrl?: string;
}

/**
 * Encode OAuth state object to URL-safe base64 string
 * @param state - State object to encode
 * @returns Encoded state string
 */
export function encodeOAuthState(state: OAuthState): string {
  const json = JSON.stringify(state);
  // Use Buffer for base64 encoding (Node.js environment)
  // In browser, we could use btoa, but this is server-side only
  return Buffer.from(json).toString('base64url');
}

/**
 * Decode OAuth state string to state object
 * @param encodedState - Encoded state string
 * @returns Decoded state object or null if invalid
 */
export function decodeOAuthState(encodedState: string): OAuthState | null {
  try {
    const json = Buffer.from(encodedState, 'base64url').toString('utf-8');
    const state = JSON.parse(json) as OAuthState;
    
    // Validate required fields
    if (!state.projectId) {
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to decode OAuth state:', error);
    return null;
  }
}
