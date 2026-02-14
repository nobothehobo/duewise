import { Task, TaskUrgency, UrgencyLevel } from '../types/task';

const CRITICAL_BUFFER = 0;
const URGENT_BUFFER = 120;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const calculateTaskUrgency = (task: Task, now = new Date()): TaskUrgency => {
  const dueDate = new Date(task.dueDate);
  const timeLeftMinutes = Math.round((dueDate.getTime() - now.getTime()) / 60000);
  const bufferMinutes = timeLeftMinutes - task.estimatedMinutes;

  let urgencyLevel: UrgencyLevel;
  if (bufferMinutes < CRITICAL_BUFFER) {
    urgencyLevel = 'critical';
  } else if (bufferMinutes <= URGENT_BUFFER) {
    urgencyLevel = 'urgent';
  } else {
    urgencyLevel = 'safe';
  }

  const latenessPressure = clamp((-bufferMinutes / Math.max(task.estimatedMinutes, 30)) * 100, 0, 100);
  const timePressure = clamp((1 - timeLeftMinutes / (24 * 60)) * 100, 0, 100);
  const importanceBoost = (task.importance ?? 2) * 8;
  const completionPenalty = task.completed ? -100 : 0;

  const urgencyScore = Math.round(latenessPressure * 0.55 + timePressure * 0.35 + importanceBoost + completionPenalty);

  return {
    task,
    timeLeftMinutes,
    bufferMinutes,
    urgencyLevel,
    urgencyScore,
  };
};

export const sortTasksByUrgency = (tasks: Task[], now = new Date()): TaskUrgency[] =>
  tasks
    .map((task) => calculateTaskUrgency(task, now))
    .sort((a, b) => {
      if (a.task.completed !== b.task.completed) {
        return Number(a.task.completed) - Number(b.task.completed);
      }
      return b.urgencyScore - a.urgencyScore;
    });

export const formatCountdown = (timeLeftMinutes: number): string => {
  if (timeLeftMinutes <= 0) {
    const lateMinutes = Math.abs(timeLeftMinutes);
    if (lateMinutes < 60) {
      return `${lateMinutes}m overdue`;
    }
    const hours = Math.floor(lateMinutes / 60);
    const minutes = lateMinutes % 60;
    return `${hours}h ${minutes}m overdue`;
  }

  const days = Math.floor(timeLeftMinutes / (24 * 60));
  const hours = Math.floor((timeLeftMinutes % (24 * 60)) / 60);
  const minutes = timeLeftMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
};
