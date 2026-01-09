import { prisma } from "../connection";
import type { Invitation } from "@prisma/client";

export interface CreateInvitationInput {
  email: string;
  token: string;
  role: "Admin" | "Member" | "Viewer";
  invitedById: string;
  expiresAt: Date;
}

export interface UpdateInvitationInput {
  acceptedAt?: Date | null;
}

/**
 * Invitation repository for managing invitation records
 * Provides methods for creating, finding, and updating invitations
 */
export class InvitationRepository {
  /**
   * Create a new invitation
   */
  async create(data: CreateInvitationInput): Promise<Invitation> {
    return prisma.invitation.create({
      data,
    });
  }

  /**
   * Find invitation by token
   */
  async findByToken(token: string): Promise<Invitation | null> {
    return prisma.invitation.findUnique({
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
  }

  /**
   * Find invitation by email
   */
  async findByEmail(email: string): Promise<Invitation | null> {
    return prisma.invitation.findUnique({
      where: { email },
    });
  }

  /**
   * Find pending invitation by email
   * Returns invitation if it exists, is not accepted, and not expired
   */
  async findPendingByEmail(email: string): Promise<Invitation | null> {
    const invitation = await prisma.invitation.findFirst({
      where: {
        email,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return invitation;
  }

  /**
   * Update an invitation
   */
  async update(
    id: string,
    data: UpdateInvitationInput,
  ): Promise<Invitation> {
    return prisma.invitation.update({
      where: { id },
      data,
    });
  }

  /**
   * Find invitation by ID (convenience method)
   */
  async findById(id: string): Promise<Invitation | null> {
    return prisma.invitation.findUnique({
      where: { id },
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
  }
}

// Export singleton instance
export const invitationRepository = new InvitationRepository();
