import crypto from "crypto";
import { decrypt } from "../integrations/storage";

/**
 * Verify HMAC signature for GitHub webhooks
 * @param payload - Raw request body as string
 * @param signature - X-Hub-Signature-256 header value
 * @param secret - Webhook secret
 * @returns true if signature is valid
 */
export function verifyGitHubSignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) {
    return false;
  }

  // GitHub uses format: sha256=<hash>
  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Verify HMAC signature for GitLab webhooks
 * @param payload - Raw request body as string
 * @param token - X-Gitlab-Token header value
 * @param secret - Webhook secret
 * @returns true if token matches secret
 */
export function verifyGitLabSignature(
  payload: string,
  token: string | null,
  secret: string,
): boolean {
  if (!token) {
    return false;
  }

  // GitLab uses token-based verification
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

/**
 * Verify HMAC signature for Bitbucket webhooks
 * @param payload - Raw request body as string
 * @param signature - X-Hub-Signature header value
 * @param secret - Webhook secret
 * @returns true if signature is valid
 */
export function verifyBitbucketSignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) {
    return false;
  }

  // Bitbucket uses format: sha256=<hash>
  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Verify webhook signature based on service type
 * @param serviceType - Git service type (GitHub, GitLab, Bitbucket)
 * @param payload - Raw request body as string
 * @param headers - Request headers
 * @param encryptedSecret - Encrypted webhook secret from database
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  serviceType: "GitHub" | "GitLab" | "Bitbucket",
  payload: string,
  headers: Headers,
  encryptedSecret: string,
): boolean {
  try {
    const secret = decrypt(encryptedSecret);

    switch (serviceType) {
      case "GitHub": {
        const signature = headers.get("x-hub-signature-256");
        return verifyGitHubSignature(payload, signature, secret);
      }
      case "GitLab": {
        const token = headers.get("x-gitlab-token");
        return verifyGitLabSignature(payload, token, secret);
      }
      case "Bitbucket": {
        const signature = headers.get("x-hub-signature");
        return verifyBitbucketSignature(payload, signature, secret);
      }
      default:
        return false;
    }
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}

