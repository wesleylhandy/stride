/**
 * GitLab OAuth and API integration
 */

export interface GitLabOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl?: string; // For self-hosted GitLab instances
}

export interface GitLabTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface GitLabRepository {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  http_url_to_repo: string;
  default_branch: string;
  visibility: string;
  description: string | null;
  updated_at: string;
}

/**
 * Get GitLab OAuth authorization URL
 * @param config - OAuth configuration
 * @param state - Optional state parameter for CSRF protection
 * @returns Authorization URL
 */
export function getGitLabAuthUrl(
  config: GitLabOAuthConfig,
  state?: string,
): string {
  const baseUrl = config.baseUrl || "https://gitlab.com";
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "api read_repository write_repository",
    state: state || crypto.randomUUID(),
  });

  return `${baseUrl}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange GitLab OAuth code for access token
 * @param code - Authorization code from callback
 * @param config - OAuth configuration
 * @returns Access token
 */
export async function exchangeGitLabCode(
  code: string,
  config: GitLabOAuthConfig,
): Promise<string> {
  const baseUrl = config.baseUrl || "https://gitlab.com";
  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitLab OAuth error: ${response.statusText}`);
  }

  const data = (await response.json()) as GitLabTokenResponse;
  return data.access_token;
}

/**
 * Get GitLab repository information
 * @param projectId - GitLab project ID
 * @param accessToken - GitLab access token
 * @param baseUrl - Optional base URL for self-hosted instances
 * @returns Repository information
 */
export async function getGitLabRepository(
  projectId: string | number,
  accessToken: string,
  baseUrl?: string,
): Promise<GitLabRepository> {
  const apiBaseUrl = baseUrl || "https://gitlab.com";
  const response = await fetch(
    `${apiBaseUrl}/api/v4/projects/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return (await response.json()) as GitLabRepository;
}

/**
 * Get file content from GitLab repository
 * @param projectId - GitLab project ID
 * @param filePath - File path
 * @param accessToken - GitLab access token
 * @param ref - Optional branch/ref (defaults to default branch)
 * @param baseUrl - Optional base URL for self-hosted instances
 * @returns File content
 */
export async function getGitLabFileContent(
  projectId: string | number,
  filePath: string,
  accessToken: string,
  ref?: string,
  baseUrl?: string,
): Promise<string> {
  const apiBaseUrl = baseUrl || "https://gitlab.com";
  const refParam = ref ? `&ref=${ref}` : "";
  const encodedPath = encodeURIComponent(filePath);
  const response = await fetch(
    `${apiBaseUrl}/api/v4/projects/${projectId}/repository/files/${encodedPath}/raw?${refParam}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Parse GitLab repository URL to extract project path
 * @param repositoryUrl - Full repository URL
 * @returns Project path (e.g., "owner/repo")
 */
export function parseGitLabRepositoryUrl(
  repositoryUrl: string,
): string | null {
  // Support formats:
  // https://gitlab.com/owner/repo
  // https://gitlab.com/owner/repo.git
  // git@gitlab.com:owner/repo.git
  const patterns = [
    /^https?:\/\/(?:[^\/]+)\/(.+?)(?:\.git)?(?:\/|$)/,
    /^git@(?:[^:]+):(.+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = repositoryUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * List GitLab repositories (projects) for the authenticated user
 * @param accessToken - GitLab access token
 * @param baseUrl - Optional base URL for self-hosted instances
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 100, max: 100)
 * @returns List of repositories with pagination info
 */
export async function listGitLabRepositories(
  accessToken: string,
  baseUrl?: string,
  page: number = 1,
  perPage: number = 100,
): Promise<{
  repositories: GitLabRepository[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const apiBaseUrl = baseUrl || "https://gitlab.com";
  const params = new URLSearchParams({
    per_page: Math.min(perPage, 100).toString(),
    page: page.toString(),
    order_by: "updated_at",
    sort: "desc",
    membership: "true", // Only show projects user is a member of
  });

  const response = await fetch(
    `${apiBaseUrl}/api/v4/projects?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const repositories = (await response.json()) as GitLabRepository[];

  // GitLab API includes pagination info in headers
  const totalHeader = response.headers.get("X-Total");
  const totalPagesHeader = response.headers.get("X-Total-Pages");
  const nextPageHeader = response.headers.get("X-Next-Page");
  const prevPageHeader = response.headers.get("X-Prev-Page");

  const total = totalHeader ? parseInt(totalHeader, 10) : repositories.length;
  const totalPages = totalPagesHeader
    ? parseInt(totalPagesHeader, 10)
    : Math.ceil(total / perPage);
  const hasNext = nextPageHeader !== null && nextPageHeader !== "";
  const hasPrev = prevPageHeader !== null && prevPageHeader !== "";

  return {
    repositories,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

/**
 * Create a webhook in GitLab repository
 * @param projectId - GitLab project ID
 * @param webhookUrl - Webhook URL to register
 * @param webhookSecret - Webhook secret
 * @param accessToken - GitLab access token
 * @param baseUrl - Optional base URL for self-hosted instances
 * @returns Webhook ID
 */
export async function createGitLabWebhook(
  projectId: string | number,
  webhookUrl: string,
  webhookSecret: string,
  accessToken: string,
  baseUrl?: string,
): Promise<number> {
  const apiBaseUrl = baseUrl || "https://gitlab.com";
  const response = await fetch(
    `${apiBaseUrl}/api/v4/projects/${projectId}/hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        push_events: true,
        merge_requests_events: true,
        token: webhookSecret,
        enable_ssl_verification: true,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitLab webhook creation failed: ${JSON.stringify(error)}`);
  }

  const data = (await response.json()) as { id: number };
  return data.id;
}

/**
 * GitLab issue response from API
 */
export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  state: "opened" | "closed";
  labels: string[];
  assignees: Array<{
    username: string;
    name: string;
    email?: string;
  }>;
  created_at: string;
  updated_at: string;
  web_url: string;
}

/**
 * GitLab vulnerability finding response from API
 */
export interface GitLabVulnerabilityFinding {
  id: number;
  name: string;
  description: string | null;
  severity: "info" | "unknown" | "low" | "medium" | "high" | "critical";
  confidence: "ignore" | "unknown" | "experimental" | "low" | "medium" | "high" | "confirmed";
  state: "dismissed" | "resolved" | "detected";
  location: {
    file?: string;
    start_line?: number;
    end_line?: number;
  };
  identifiers: Array<{
    name: string;
    value: string;
  }>;
  project: {
    id: number;
    name: string;
    path_with_namespace: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Fetch GitLab repository issues
 * @param projectId - GitLab project ID
 * @param accessToken - GitLab access token
 * @param options - Optional fetch options
 * @param baseUrl - Optional base URL for self-hosted instances
 * @returns Array of issues with pagination info
 */
export async function fetchGitLabIssues(
  projectId: string | number,
  accessToken: string,
  options?: {
    state?: "opened" | "closed" | "all";
    page?: number;
    perPage?: number;
    includeClosed?: boolean;
  },
  baseUrl?: string,
): Promise<{
  issues: GitLabIssue[];
  hasNext: boolean;
  nextPage?: number;
}> {
  const apiBaseUrl = baseUrl || "https://gitlab.com";
  const state = options?.includeClosed
    ? options.state || "all"
    : options?.state || "opened";
  const page = options?.page || 1;
  const perPage = Math.min(options?.perPage || 100, 100);

  const params = new URLSearchParams({
    state,
    page: page.toString(),
    per_page: perPage.toString(),
    order_by: "created_at",
    sort: "desc",
  });

  const response = await fetch(
    `${apiBaseUrl}/api/v4/projects/${projectId}/issues?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const issues = (await response.json()) as GitLabIssue[];

  // Parse Link header for pagination
  const linkHeader = response.headers.get("Link");
  let hasNext = false;
  let nextPage: number | undefined;

  if (linkHeader) {
    const links = linkHeader.split(",");
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match && match[2] === "next" && match[1]) {
        hasNext = true;
        const url = new URL(match[1]);
        const nextPageParam = url.searchParams.get("page");
        if (nextPageParam) {
          nextPage = parseInt(nextPageParam, 10);
        }
      }
    }
  }

  return {
    issues,
    hasNext,
    nextPage,
  };
}

/**
 * Fetch GitLab vulnerability findings
 * @param projectId - GitLab project ID
 * @param accessToken - GitLab access token
 * @param options - Optional fetch options
 * @param baseUrl - Optional base URL for self-hosted instances
 * @returns Array of vulnerability findings with pagination info
 */
export async function fetchGitLabVulnerabilityFindings(
  projectId: string | number,
  accessToken: string,
  options?: {
    state?: "dismissed" | "resolved" | "detected";
    page?: number;
    perPage?: number;
  },
  baseUrl?: string,
): Promise<{
  findings: GitLabVulnerabilityFinding[];
  hasNext: boolean;
  nextPage?: number;
}> {
  const apiBaseUrl = baseUrl || "https://gitlab.com";
  const state = options?.state || "detected";
  const page = options?.page || 1;
  const perPage = Math.min(options?.perPage || 100, 100);

  const params = new URLSearchParams({
    state,
    page: page.toString(),
    per_page: perPage.toString(),
  });

  const response = await fetch(
    `${apiBaseUrl}/api/v4/projects/${projectId}/vulnerability_findings?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    // If 403 or 404, vulnerability findings may not be available (requires Premium/Ultimate)
    if (response.status === 403 || response.status === 404) {
      return {
        findings: [],
        hasNext: false,
      };
    }
    throw new Error(`GitLab API error: ${response.statusText}`);
  }

  const findings = (await response.json()) as GitLabVulnerabilityFinding[];

  // Parse Link header for pagination
  const linkHeader = response.headers.get("Link");
  let hasNext = false;
  let nextPage: number | undefined;

  if (linkHeader) {
    const links = linkHeader.split(",");
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match && match[2] === "next" && match[1]) {
        hasNext = true;
        const url = new URL(match[1]);
        const nextPageParam = url.searchParams.get("page");
        if (nextPageParam) {
          nextPage = parseInt(nextPageParam, 10);
        }
      }
    }
  }

  return {
    findings,
    hasNext,
    nextPage,
  };
}

