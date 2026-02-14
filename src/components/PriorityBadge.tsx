import { ImportanceLevel } from '../types/task';

interface PriorityBadgeProps {
  importance?: ImportanceLevel;
}

const labels: Record<ImportanceLevel, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

export const PriorityBadge = ({ importance = 2 }: PriorityBadgeProps) => (
  <span className={`priority-badge priority-${importance}`}>
    {labels[importance]} priority
  </span>
);
