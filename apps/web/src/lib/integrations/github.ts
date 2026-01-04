/**
 * GitHub OAuth and API integration
 */

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
}

/**
 * Get GitHub OAuth authorization URL
 * @param config - OAuth configuration
 * @param state - Optional state parameter for CSRF protection
 * @returns Authorization URL
 */
export function getGitHubAuthUrl(
  config: GitHubOAuthConfig,
  state?: string,
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "repo admin:repo_hook",
    state: state || crypto.randomUUID(),
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange GitHub OAuth code for access token
 * @param code - Authorization code from callback
 * @param config - OAuth configuration
 * @returns Access token
 */
export async function exchangeGitHubCode(
  code: string,
  config: GitHubOAuthConfig,
): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub OAuth error: ${response.statusText}`);
  }

  const data = (await response.json()) as GitHubTokenResponse;
  return data.access_token;
}

/**
 * Get GitHub repository information
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param accessToken - GitHub access token
 * @returns Repository information
 */
export async function getGitHubRepository(
  owner: string,
  repo: string,
  accessToken: string,
): Promise<GitHubRepository> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return (await response.json()) as GitHubRepository;
}

/**
 * Get file content from GitHub repository
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path
 * @param accessToken - GitHub access token
 * @param ref - Optional branch/ref (defaults to default branch)
 * @returns File content
 */
export async function getGitHubFileContent(
  owner: string,
  repo: string,
  path: string,
  accessToken: string,
  ref?: string,
): Promise<string> {
  const refParam = ref ? `?ref=${ref}` : "";
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}${refParam}`,
    {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = (await response.json()) as { content: string; encoding: string };

  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf8");
  }

  return data.content;
}

/**
 * Parse repository URL to extract owner and repo
 * @param repositoryUrl - Full repository URL
 * @returns Object with owner and repo name
 */
export function parseGitHubRepositoryUrl(
  repositoryUrl: string,
): { owner: string; repo: string } | null {
  // Support formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/,
    /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = repositoryUrl.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
  }

  return null;
}

/**
 * Create a webhook in GitHub repository
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param webhookUrl - Webhook URL to register
 * @param webhookSecret - Webhook secret
 * @param accessToken - GitHub access token
 * @returns Webhook ID
 */
export async function createGitHubWebhook(
  owner: string,
  repo: string,
  webhookUrl: string,
  webhookSecret: string,
  accessToken: string,
): Promise<number> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["push", "pull_request"],
        config: {
          url: webhookUrl,
          content_type: "json",
          secret: webhookSecret,
          insecure_ssl: "0",
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub webhook creation failed: ${JSON.stringify(error)}`);
  }

  const data = (await response.json()) as { id: number };
  return data.id;
}

