/**
 * Invitation service for managing user invitations
 * Handles invitation creation, validation, and acceptance
 */

import { randomBytes } from 'crypto';
import { prisma } from '@stride/database';
import type { Invitation, UserRole } from '@stride/types';
import { hashPassword } from '../auth/password';
import { createSession } from '../auth/session';
import { logger } from '../logger';

export interface CreateInvitationInput {
  email: string;
  role: UserRole;
  invitedById: string;
}

export interface AcceptInvitationResult {
  user: {
    id: string;
    email: string;
    username: string;
    name?: string | null;
    role: UserRole;
  };
  token: string;
}

/**
 * Invitation service class
 */
export class InvitationService {
  /**
   * Generate a cryptographically secure invitation token
   * Returns a 64-character hexadecimal string (32 bytes)
   */
  generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new invitation with 7-day expiration
   * Includes retry logic for token collision (extremely rare)
   */
  async createInvitation(input: CreateInvitationInput): Promise<Invitation> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const maxRetries = 5;
    let attempts = 0;

    while (attempts < maxRetries) {
      const token = this.generateInvitationToken();
      attempts++;

      try {
        const invitation = await prisma.invitation.create({
          data: {
            email: input.email,
            token,
            role: input.role as 'Admin' | 'Member' | 'Viewer',
            invitedById: input.invitedById,
            expiresAt,
          },
        });

        logger.info('Invitation created successfully', {
          invitationId: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
          attempts,
        });

        return invitation as Invitation;
      } catch (error) {
        // Check if error is due to token collision (unique constraint violation)
        const isTokenCollision =
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002' &&
          (error as { meta?: { target?: string[] } }).meta?.target?.includes('token');

        // Check if error is due to email already exists
        const isEmailExists =
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002' &&
          (error as { meta?: { target?: string[] } }).meta?.target?.includes('email');

        if (isEmailExists) {
          logger.error(
            'Failed to create invitation: email already exists',
            error instanceof Error ? error : undefined,
            {
              email: input.email,
            },
          );
          throw new Error('An invitation for this email already exists');
        }

        if (isTokenCollision && attempts < maxRetries) {
          logger.warn('Token collision detected, retrying with new token', {
            email: input.email,
            attempt: attempts,
            maxRetries,
          });
          // Continue loop to retry with new token
          continue;
        }

        // If not a token collision, or max retries reached, throw error
        logger.error(
          'Failed to create invitation',
          error instanceof Error ? error : undefined,
          {
            email: input.email,
            attempts,
          },
        );

        if (isTokenCollision) {
          throw new Error(
            'Failed to create invitation due to token collision. Please try again.',
          );
        }

        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Failed to create invitation after maximum retries');
  }

  /**
   * Find invitation by token
   * Returns invitation if valid (not expired, not accepted), null otherwise
   */
  async findInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!invitation) {
        return null;
      }

      // Check if already accepted
      if (invitation.acceptedAt) {
        return null;
      }

      // Check if expired
      if (invitation.expiresAt < new Date()) {
        return null;
      }

      return invitation as Invitation;
    } catch (error) {
      logger.error(
        'Failed to find invitation by token',
        error instanceof Error ? error : undefined,
        {
          token: token.substring(0, 8) + '...', // Log partial token only
        },
      );
      return null;
    }
  }

  /**
   * Validate if an invitation is valid (not expired, not accepted)
   */
  async validateInvitation(token: string): Promise<{
    isValid: boolean;
    invitation?: Invitation;
    error?: string;
  }> {
    const invitation = await this.findInvitationByToken(token);

    if (!invitation) {
      return {
        isValid: false,
        error: 'Invitation not found or invalid',
      };
    }

    return {
      isValid: true,
      invitation,
    };
  }

  /**
   * Accept an invitation and create user account
   * Marks invitation as accepted and returns user with session token
   * Uses database transaction to prevent concurrent acceptance race conditions
   */
  async acceptInvitation(
    token: string,
    username: string,
    password: string,
    name?: string,
  ): Promise<AcceptInvitationResult> {
    // First, validate invitation exists and is not expired
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      throw new Error('This invitation has already been accepted');
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      throw new Error('This invitation has expired');
    }

    // Hash password before transaction
    const passwordHash = await hashPassword(password);

    // Use transaction to prevent concurrent acceptance
    // Transaction ensures atomicity: either both user creation and invitation update succeed, or both fail
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // Re-check invitation status within transaction to prevent race conditions
          const currentInvitation = await tx.invitation.findUnique({
            where: { id: invitation.id },
          });

          if (!currentInvitation) {
            throw new Error('Invitation not found');
          }

          if (currentInvitation.acceptedAt) {
            throw new Error('This invitation has already been accepted');
          }

          if (currentInvitation.expiresAt < new Date()) {
            throw new Error('This invitation has expired');
          }

          // Check if email already exists (double-check within transaction)
          const existingUser = await tx.user.findUnique({
            where: { email: invitation.email },
          });

          if (existingUser) {
            throw new Error('A user with this email already exists');
          }

          // Check if username already exists
          const existingUsername = await tx.user.findUnique({
            where: { username },
          });

          if (existingUsername) {
            throw new Error('Username already taken');
          }

          // Create user
          const user = await tx.user.create({
            data: {
              email: invitation.email,
              username,
              passwordHash,
              name: name || null,
              role: invitation.role as 'Admin' | 'Member' | 'Viewer',
            },
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              role: true,
            },
          });

          // Mark invitation as accepted (atomic with user creation)
          await tx.invitation.update({
            where: { id: invitation.id },
            data: {
              acceptedAt: new Date(),
            },
          });

          return user;
        },
        {
          maxWait: 5000, // Maximum time to wait for transaction
          timeout: 10000, // Maximum time transaction can run
        },
      );

      // Create session and return token
      const sessionToken = await createSession(
        result.id,
        result.email,
        result.role as UserRole,
      );

      logger.info('Invitation accepted and user created', {
        userId: result.id,
        email: result.email,
        invitationId: invitation.id,
      });

      return {
        user: {
          ...result,
          role: result.role as UserRole,
        },
        token: sessionToken,
      };
    } catch (error) {
      // Handle transaction errors with user-friendly messages
      if (error instanceof Error) {
        // Re-throw known errors
        if (
          error.message.includes('already been accepted') ||
          error.message.includes('expired') ||
          error.message.includes('already exists') ||
          error.message.includes('already taken') ||
          error.message.includes('not found')
        ) {
          throw error;
        }
      }

      // Handle Prisma transaction timeout or deadlock
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'P2034' || error.code === 'P3000')
      ) {
        logger.error(
          'Transaction conflict during invitation acceptance',
          error instanceof Error ? error : undefined,
          {
            token: token.substring(0, 8) + '...',
            errorCode: String(error.code),
          },
        );
        throw new Error(
          'Another process is accepting this invitation. Please try again.',
        );
      }

      // Handle unique constraint violations from transaction
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        const target = (error as { meta?: { target?: string[] } }).meta
          ?.target?.[0];
        if (target === 'email') {
          throw new Error('A user with this email already exists');
        }
        if (target === 'username') {
          throw new Error('Username already taken');
        }
      }

      logger.error(
        'Failed to accept invitation',
        error instanceof Error ? error : undefined,
        {
          token: token.substring(0, 8) + '...',
        },
      );
      throw new Error(
        'Failed to accept invitation. Please try again or contact support if the problem persists.',
      );
    }
  }
}

// Export singleton instance
export const invitationService = new InvitationService();
