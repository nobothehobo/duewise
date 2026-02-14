export type ImportanceLevel = 1 | 2 | 3;

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  estimatedMinutes: number;
  importance?: ImportanceLevel;
  completed: boolean;
}

export type UrgencyLevel = 'critical' | 'urgent' | 'safe';

export interface TaskUrgency {
  task: Task;
  timeLeftMinutes: number;
  bufferMinutes: number;
  urgencyLevel: UrgencyLevel;
  urgencyScore: number;
}
