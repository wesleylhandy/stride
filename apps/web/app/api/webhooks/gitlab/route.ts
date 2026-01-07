import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stride/database";
import { verifyWebhookSignature } from "@/lib/webhooks/verification";
import {
  parseGitLabPush,
  parseGitLabMergeRequest,
  type GitLabPushPayload,
  type GitLabMergeRequestPayload,
} from "@/lib/webhooks/parsers";
import {
  handleWebhookError,
  logWebhookSuccess,
} from "@/lib/webhooks/handlers";
import { processBranchCreation } from "@/lib/webhooks/branch-detection";
import {
  parseGitLabMR,
  processPRWebhook,
} from "@/lib/webhooks/pr-parser";
import { issueBranchRepository, PullRequestStatus } from "@stride/database";

/**
 * GitLab webhook endpoint
 * Handles push and merge_request events
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

  const eventType = (payload as { object_kind?: string }).object_kind;
  const eventName = (payload as { event_name?: string }).event_name;

  if (!eventType && !eventName) {
    return NextResponse.json(
      { error: "Missing event type" },
      { status: 400 },
    );
  }

  // Find repository connection by repository URL
  let repositoryConnection;
  let projectId: string | undefined;

  try {
    if (eventType === "push" || eventName === "push") {
      const pushPayload = parseGitLabPush(payload);
      if (!pushPayload) {
        return NextResponse.json(
          { error: "Invalid push payload" },
          { status: 400 },
        );
      }

      const repositoryUrl = pushPayload.project.web_url;
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
        "GitLab",
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
        const commitSha = pushPayload.after;

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
            serviceType: "GitLab",
            eventType: "push",
            projectId,
            repositoryUrl,
            issueKey: branchName,
          });
        }
      }
    } else if (eventType === "merge_request") {
      const mrPayload = parseGitLabMergeRequest(payload);
      if (!mrPayload) {
        return NextResponse.json(
          { error: "Invalid merge request payload" },
          { status: 400 },
        );
      }

      const repositoryUrl = mrPayload.project.web_url;
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
        "GitLab",
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

      // Parse MR data
      const mrData = parseGitLabMR(mrPayload);
      if (mrData && mrData.issueKey) {
        // Process MR webhook
        const issueId = await processPRWebhook(projectId, mrData);

        if (issueId) {
          // Link or update MR
          const prStatusMap: Record<string, PullRequestStatus> = {
            open: PullRequestStatus.Open,
            merged: PullRequestStatus.Merged,
            closed: PullRequestStatus.Closed,
          };

          await issueBranchRepository.createOrUpdate(issueId, mrData.branchName, {
            pullRequestUrl: mrData.prUrl,
            pullRequestNumber: mrData.prNumber,
            pullRequestStatus: prStatusMap[mrData.prStatus],
            lastCommitSha: mrData.commitSha,
          });

          logWebhookSuccess({
            serviceType: "GitLab",
            eventType: "merge_request",
            projectId,
            repositoryUrl,
            issueKey: mrData.issueKey,
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
      serviceType: "GitLab",
      eventType: eventType || eventName || "unknown",
      projectId: projectId || undefined,
      repositoryUrl: repositoryConnection?.repositoryUrl,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

