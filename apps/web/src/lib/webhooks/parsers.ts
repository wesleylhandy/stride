/**
 * Webhook payload parsers for different Git services
 */

export interface GitHubPushPayload {
  ref: string;
  repository: {
    full_name: string;
    html_url: string;
  };
  commits?: Array<{
    sha: string;
    message: string;
  }>;
  head_commit?: {
    id: string;
  };
}

export interface GitHubPullRequestPayload {
  action: string;
  pull_request: {
    number: number;
    state: string;
    merged: boolean;
    merged_at: string | null;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
    };
    html_url: string;
  };
  repository: {
    full_name: string;
  };
}

export interface GitLabPushPayload {
  ref: string;
  project: {
    path_with_namespace: string;
    web_url: string;
  };
  commits?: Array<{
    id: string;
    message: string;
  }>;
  after?: string;
}

export interface GitLabMergeRequestPayload {
  object_kind: string;
  event_type: string;
  project: {
    path_with_namespace: string;
    web_url: string;
  };
  object_attributes: {
    id: number;
    iid: number;
    state: string;
    merged: boolean;
    merged_at: string | null;
    source_branch: string;
    target_branch: string;
    last_commit: {
      id: string;
    };
    url: string;
  };
}

export interface BitbucketPushPayload {
  push: {
    changes: Array<{
      new: {
        name: string;
        type: string;
        target: {
          hash: string;
          message: string;
        };
      };
    }>;
  };
  repository: {
    full_name: string;
    links: {
      html: {
        href: string;
      };
    };
  };
}

export interface BitbucketPullRequestPayload {
  pullrequest: {
    id: number;
    state: string;
    source: {
      branch: {
        name: string;
      };
      commit: {
        hash: string;
      };
    };
    destination: {
      branch: {
        name: string;
      };
    };
    links: {
      html: {
        href: string;
      };
    };
  };
  repository: {
    full_name: string;
  };
}

/**
 * Parse GitHub push webhook payload
 */
export function parseGitHubPush(payload: unknown): GitHubPushPayload | null {
  try {
    const data = payload as GitHubPushPayload;
    if (data.ref && data.repository) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse GitHub pull request webhook payload
 */
export function parseGitHubPullRequest(
  payload: unknown,
): GitHubPullRequestPayload | null {
  try {
    const data = payload as GitHubPullRequestPayload;
    if (data.action && data.pull_request && data.repository) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse GitLab push webhook payload
 */
export function parseGitLabPush(payload: unknown): GitLabPushPayload | null {
  try {
    const data = payload as GitLabPushPayload;
    if (data.ref && data.project) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse GitLab merge request webhook payload
 */
export function parseGitLabMergeRequest(
  payload: unknown,
): GitLabMergeRequestPayload | null {
  try {
    const data = payload as GitLabMergeRequestPayload;
    if (
      data.object_kind === "merge_request" &&
      data.object_attributes &&
      data.project
    ) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse Bitbucket push webhook payload
 */
export function parseBitbucketPush(
  payload: unknown,
): BitbucketPushPayload | null {
  try {
    const data = payload as BitbucketPushPayload;
    if (data.push && data.repository) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse Bitbucket pull request webhook payload
 */
export function parseBitbucketPullRequest(
  payload: unknown,
): BitbucketPullRequestPayload | null {
  try {
    const data = payload as BitbucketPullRequestPayload;
    if (data.pullrequest && data.repository) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

