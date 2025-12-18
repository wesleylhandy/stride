export enum UserRole {
  Admin = 'Admin',
  Member = 'Member',
  Viewer = 'Viewer',
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  name?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  role?: UserRole;
}

