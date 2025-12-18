export interface Cycle {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCycleInput {
  projectId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
}

export interface UpdateCycleInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  goal?: string;
}

export interface CycleMetrics {
  totalStoryPoints: number;
  completedStoryPoints: number;
  remainingStoryPoints: number;
  averageCycleTime: number;
  burndownData: BurndownDataPoint[];
}

export interface BurndownDataPoint {
  date: Date;
  remaining: number;
}

