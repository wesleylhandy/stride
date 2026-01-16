/**
 * Bitbucket OAuth and API integration
 */

/**
 * Bitbucket issue response from API
 */
export interface BitbucketIssue {
  id: string;
  title: string;
  content: {
    raw: string;
    markup: string;
    html: string;
    type: string;
  };
  state: "new" | "open" | "resolved" | "on hold" | "invalid" | "duplicate" | "wontfix" | "closed";
  kind: "bug" | "enhancement" | "proposal" | "task";
  priority: "trivial" | "minor" | "major" | "critical" | "blocker";
  created_on: string;
  updated_on: string;
  links: {
    html: {
      href: string;
    };
  };
}

/**
 * Bitbucket paginated response
 */
export interface BitbucketPaginatedResponse<T> {
  values: T[];
  page: number;
  pagelen: number;
  size: number;
  next?: string;
  previous?: string;
}

/**
 * Parse Bitbucket repository URL to extract workspace and repo slug
 * @param repositoryUrl - Full repository URL
 * @returns Object with workspace and repo slug
 */
export function parseBitbucketRepositoryUrl(
  repositoryUrl: string,
): { workspace: string; repoSlug: string } | null {
  // Support formats:
  // https://bitbucket.org/workspace/repo
  // https://bitbucket.org/workspace/repo.git
  // git@bitbucket.org:workspace/repo.git
  const patterns = [
    /^https?:\/\/bitbucket\.org\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/,
    /^git@bitbucket\.org:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = repositoryUrl.match(pattern);
    if (match && match[1] && match[2]) {
      return {
        workspace: match[1],
        repoSlug: match[2],
      };
    }
  }

  return null;
}

/**
 * Fetch Bitbucket repository issues
 * @param workspace - Bitbucket workspace
 * @param repoSlug - Repository slug
 * @param accessToken - Bitbucket access token (App Password)
 * @param options - Optional fetch options
 * @returns Array of issues with pagination info
 */
export async function fetchBitbucketIssues(
  workspace: string,
  repoSlug: string,
  accessToken: string,
  options?: {
    state?: "new" | "open" | "resolved" | "on hold" | "invalid" | "duplicate" | "wontfix" | "closed" | "all";
    page?: number;
    perPage?: number;
    includeClosed?: boolean;
  },
): Promise<{
  issues: BitbucketIssue[];
  hasNext: boolean;
  nextPage?: number;
  nextUrl?: string;
}> {
  const page = options?.page || 1;
  const perPage = Math.min(options?.perPage || 100, 100);

  // Build query filter
  const queryParts: string[] = [];
  if (options?.includeClosed) {
    // Include all states when includeClosed is true
    if (options.state && options.state !== "all") {
      queryParts.push(`state="${options.state}"`);
    }
  } else {
    // Default to open issues only
    queryParts.push('state="new" OR state="open"');
  }

  const q = queryParts.length > 0 ? queryParts.join(" AND ") : undefined;

  const params = new URLSearchParams({
    page: page.toString(),
    pagelen: perPage.toString(),
  });

  if (q) {
    params.append("q", q);
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/issues?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Bitbucket API error: ${response.statusText}`);
  }

  const data = (await response.json()) as BitbucketPaginatedResponse<BitbucketIssue>;

  // Bitbucket uses `next` URL in response for pagination
  const hasNext = !!data.next;
  let nextPage: number | undefined;
  let nextUrl: string | undefined;

  if (data.next) {
    nextUrl = data.next;
    // Extract page number from next URL if possible
    try {
      const url = new URL(data.next);
      const pageParam = url.searchParams.get("page");
      if (pageParam) {
        nextPage = parseInt(pageParam, 10);
      }
    } catch {
      // If URL parsing fails, just use the URL
    }
  }

  return {
    issues: data.values,
    hasNext,
    nextPage,
    nextUrl,
  };
}
