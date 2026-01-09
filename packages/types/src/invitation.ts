import { UserRole } from './user';

export interface InviteUserInput {
  email: string;
  role: 'Member' | 'Viewer';
}

export interface AcceptInvitationInput {
  username: string;
  password: string;
  name?: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: UserRole;
  invitedById: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
