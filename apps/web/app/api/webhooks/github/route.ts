import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stride/database";
import { verifyWebhookSignature } from "@/lib/webhooks/verification";
import {
  parseGitHubPush,
  parseGitHubPullRequest,
  type GitHubPushPayload,
  type GitHubPullRequestPayload,
} from "@/lib/webhooks/parsers";
import {
  handleWebhookError,
  logWebhookSuccess,
} from "@/lib/webhooks/handlers";
import { processBranchCreation } from "@/lib/webhooks/branch-detection";
import {
  parseGitHubPR,
  processPRWebhook,
} from "@/lib/webhooks/pr-parser";
import { issueBranchRepository } from "@stride/database";
import { PullRequestStatus } from "@prisma/client";

/**
 * GitHub webhook endpoint
 * Handles push and pull_request events
 */
export async function POST(request: NextRequest) {
  let rawBody: string;
  let payload: unknown;

  try {
    rawBody = await request.text();
    payload = JSON.parse(rawBody);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const eventType = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");

  if (!eventType || !deliveryId) {
    return NextResponse.json(
      { error: "Missing required headers" },
      { status: 400 },
    );
  }

  // Find repository connection by repository URL
  let repositoryConnection;
  let projectId: string;

  try {
    if (eventType === "push") {
      const pushPayload = parseGitHubPush(payload);
      if (!pushPayload) {
        return NextResponse.json(
          { error: "Invalid push payload" },
          { status: 400 },
        );
      }

      const repositoryUrl = `https://github.com/${pushPayload.repository.full_name}`;
      repositoryConnection = await prisma.repositoryConnection.findUnique({
        where: { repositoryUrl },
        include: { project: true },
      });

      if (!repositoryConnection) {
        return NextResponse.json(
          { error: "Repository not found" },
          { status: 404 },
        );
      }

      projectId = repositoryConnection.projectId;

      // Verify signature
      const isValid = verifyWebhookSignature(
        "GitHub",
        rawBody,
        request.headers,
        repositoryConnection.webhookSecret,
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }

      // Process push event
      const ref = pushPayload.ref;
      if (ref.startsWith("refs/heads/")) {
        const branchName = ref.replace("refs/heads/", "");
        const commitSha = pushPayload.head_commit?.id;

        // Process branch creation
        const issueId = await processBranchCreation(
          projectId,
          branchName,
          commitSha,
        );

        if (issueId) {
          // Link branch to issue
          await issueBranchRepository.createOrUpdate(issueId, branchName, {
            lastCommitSha: commitSha,
          });

          logWebhookSuccess({
            serviceType: "GitHub",
            eventType: "push",
            projectId,
            repositoryUrl,
            issueKey: branchName,
          });
        }
      }
    } else if (eventType === "pull_request") {
      const prPayload = parseGitHubPullRequest(payload);
      if (!prPayload) {
        return NextResponse.json(
          { error: "Invalid pull request payload" },
          { status: 400 },
        );
      }

      const repositoryUrl = `https://github.com/${prPayload.repository.full_name}`;
      repositoryConnection = await prisma.repositoryConnection.findUnique({
        where: { repositoryUrl },
        include: { project: true },
      });

      if (!repositoryConnection) {
        return NextResponse.json(
          { error: "Repository not found" },
          { status: 404 },
        );
      }

      projectId = repositoryConnection.projectId;

      // Verify signature
      const isValid = verifyWebhookSignature(
        "GitHub",
        rawBody,
        request.headers,
        repositoryConnection.webhookSecret,
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }

      // Parse PR data
      const prData = parseGitHubPR(prPayload);
      if (prData && prData.issueKey) {
        // Process PR webhook
        const issueId = await processPRWebhook(projectId, prData);

        if (issueId) {
          // Link or update PR
          const prStatusMap: Record<string, PullRequestStatus> = {
            open: PullRequestStatus.Open,
            merged: PullRequestStatus.Merged,
            closed: PullRequestStatus.Closed,
          };

          await issueBranchRepository.createOrUpdate(issueId, prData.branchName, {
            pullRequestUrl: prData.prUrl,
            pullRequestNumber: prData.prNumber,
            pullRequestStatus: prStatusMap[prData.prStatus],
            lastCommitSha: prData.commitSha,
          });

          logWebhookSuccess({
            serviceType: "GitHub",
            eventType: "pull_request",
            projectId,
            repositoryUrl,
            issueKey: prData.issueKey,
          });
        }
      }
    } else {
      // Unsupported event type
      return NextResponse.json(
        { message: "Event type not supported" },
        { status: 200 },
      );
    }

    // Update webhook last received timestamp
    await prisma.repositoryConnection.update({
      where: { id: repositoryConnection.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch (error) {
    handleWebhookError(error, {
      serviceType: "GitHub",
      eventType: eventType || "unknown",
      projectId: projectId || undefined,
      repositoryUrl: repositoryConnection?.repositoryUrl,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

