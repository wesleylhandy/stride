export enum IssueType {
  Bug = 'Bug',
  Feature = 'Feature',
  Task = 'Task',
  Epic = 'Epic',
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export interface Issue {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  type: IssueType;
  priority?: Priority;
  reporterId: string;
  assigneeId?: string;
  cycleId?: string;
  customFields: Record<string, unknown>;
  storyPoints?: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface CreateIssueInput {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  type?: IssueType;
  priority?: Priority;
  assigneeId?: string;
  cycleId?: string;
  customFields?: Record<string, unknown>;
  storyPoints?: number;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  status?: string;
  type?: IssueType;
  priority?: Priority;
  assigneeId?: string;
  cycleId?: string;
  customFields?: Record<string, unknown>;
  storyPoints?: number;
}

