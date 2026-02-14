import { TaskUrgency } from '../types/task';
import { formatCountdown } from '../utils/urgency';
import { PriorityBadge } from './PriorityBadge';
import { UrgencyRing } from './UrgencyRing';

interface TaskCardProps {
  taskUrgency: TaskUrgency;
  onEdit: (id: string) => void;
  onToggleComplete: (id: string) => void;
  compact?: boolean;
}

export const TaskCard = ({ taskUrgency, onEdit, onToggleComplete, compact = false }: TaskCardProps) => {
  const { task, urgencyLevel, urgencyScore, timeLeftMinutes } = taskUrgency;

  return (
    <article className={`task-card ${urgencyLevel} ${task.completed ? 'completed' : ''} ${compact ? 'compact' : ''}`}>
      <div className="task-card-main">
        <div className="task-card-header">
          <h3>{task.title}</h3>
          <PriorityBadge importance={task.importance} />
        </div>
        <p className="task-meta">Due {new Date(task.dueDate).toLocaleString()}</p>
        <div className="task-metrics">
          <span>{formatCountdown(timeLeftMinutes)}</span>
          <span>{task.estimatedMinutes} min planned</span>
        </div>
      </div>
      <div className="task-card-side">
        <UrgencyRing score={urgencyScore} label={task.title} />
        <div className="task-actions">
          <button type="button" className="secondary" onClick={() => onEdit(task.id)}>
            Edit
          </button>
          <button type="button" onClick={() => onToggleComplete(task.id)}>
            {task.completed ? 'Reopen' : 'Done'}
          </button>
        </div>
      </div>
    </article>
  );
};
