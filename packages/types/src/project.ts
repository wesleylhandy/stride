export enum RepositoryServiceType {
  GitHub = 'GitHub',
  GitLab = 'GitLab',
  Bitbucket = 'Bitbucket',
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  configYaml: string;
  config: ProjectConfig;
  configVersion?: string;
  repositoryUrl?: string;
  repositoryType?: RepositoryServiceType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectConfig {
  project_key: string;
  project_name: string;
  workflow: WorkflowConfig;
  custom_fields: CustomFieldConfig[];
  automation_rules: AutomationRule[];
  user_assignment?: UserAssignmentConfig;
  ai_triage_config?: AiTriageConfig;
}

export interface UserAssignmentConfig {
  default_assignee: 'none' | 'reporter';
  assignee_required: boolean;
  clone_preserve_assignee: boolean;
  require_assignee_for_statuses: string[];
}

export interface AiTriageConfig {
  permissions: ('admin' | 'member' | 'viewer')[];
  enabled: boolean;
}

export interface WorkflowConfig {
  default_status: string;
  statuses: StatusConfig[];
}

export interface StatusConfig {
  key: string;
  name: string;
  type: 'open' | 'in_progress' | 'closed';
}

export interface CustomFieldConfig {
  key: string;
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'boolean';
  options?: string[];
  required: boolean;
}

export interface AutomationRule {
  trigger: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface CreateProjectInput {
  key: string;
  name: string;
  description?: string;
  repositoryUrl?: string;
  repositoryType?: RepositoryServiceType;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  repositoryUrl?: string;
  repositoryType?: RepositoryServiceType;
}

