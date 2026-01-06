import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stride/database";
import { verifyWebhookSignature } from "@/lib/webhooks/verification";
import {
  parseBitbucketPush,
  parseBitbucketPullRequest,
  type BitbucketPushPayload,
  type BitbucketPullRequestPayload,
} from "@/lib/webhooks/parsers";
import {
  handleWebhookError,
  logWebhookSuccess,
} from "@/lib/webhooks/handlers";
import { processBranchCreation } from "@/lib/webhooks/branch-detection";
import {
  parseBitbucketPR,
  processPRWebhook,
} from "@/lib/webhooks/pr-parser";
import { issueBranchRepository } from "@stride/database";
import { PullRequestStatus } from "@prisma/client";

/**
 * Bitbucket webhook endpoint
 * Handles push and pullrequest events
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

  const eventType = request.headers.get("x-event-key");

  if (!eventType) {
    return NextResponse.json(
      { error: "Missing event type" },
      { status: 400 },
    );
  }

  // Find repository connection by repository URL
  let repositoryConnection;
  let projectId: string;

  try {
    if (eventType === "repo:push") {
      const pushPayload = parseBitbucketPush(payload);
      if (!pushPayload) {
        return NextResponse.json(
          { error: "Invalid push payload" },
          { status: 400 },
        );
      }

      const repositoryUrl = pushPayload.repository.links.html.href;
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
        "Bitbucket",
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
      const changes = pushPayload.push.changes;
      for (const change of changes) {
        if (change.new && change.new.type === "branch") {
          const branchName = change.new.name;
          const commitSha = change.new.target?.hash;

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
              serviceType: "Bitbucket",
              eventType: "push",
              projectId,
              repositoryUrl,
              issueKey: branchName,
            });
          }
        }
      }
    } else if (eventType === "pullrequest:created" || eventType === "pullrequest:updated" || eventType === "pullrequest:fulfilled" || eventType === "pullrequest:rejected") {
      const prPayload = parseBitbucketPullRequest(payload);
      if (!prPayload) {
        return NextResponse.json(
          { error: "Invalid pull request payload" },
          { status: 400 },
        );
      }

      const repositoryUrl = prPayload.repository.full_name;
      // Bitbucket uses workspace/repo format, need to construct URL
      const fullUrl = `https://bitbucket.org/${repositoryUrl}`;
      
      repositoryConnection = await prisma.repositoryConnection.findFirst({
        where: {
          repositoryUrl: {
            contains: repositoryUrl,
          },
        },
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
        "Bitbucket",
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
      const prData = parseBitbucketPR(prPayload);
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
            serviceType: "Bitbucket",
            eventType: "pull_request",
            projectId,
            repositoryUrl: fullUrl,
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
      serviceType: "Bitbucket",
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

