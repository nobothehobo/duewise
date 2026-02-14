import { FormEvent, useMemo, useState } from 'react';
import { TaskCard } from './components/TaskCard';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Task } from './types/task';
import { sortTasksByUrgency } from './utils/urgency';
import './styles.css';

interface TaskDraft {
  title: string;
  dueDate: string;
  estimatedMinutes: number;
  importance: 1 | 2 | 3;
}

const createInitialDraft = (): TaskDraft => {
  const date = new Date();
  date.setHours(date.getHours() + 3);
  return {
    title: '',
    dueDate: date.toISOString().slice(0, 16),
    estimatedMinutes: 30,
    importance: 2,
  };
};

const App = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('duewise.tasks', []);
  const [draft, setDraft] = useState<TaskDraft>(createInitialDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedTasks = useMemo(() => sortTasksByUrgency(tasks), [tasks]);
  const nextTask = sortedTasks.find((entry) => !entry.task.completed);

  const resetDraft = () => {
    setDraft(createInitialDraft());
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedTitle = draft.title.trim();
    if (!trimmedTitle) {
      return;
    }

    if (editingId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingId
            ? {
                ...task,
                title: trimmedTitle,
                dueDate: new Date(draft.dueDate).toISOString(),
                estimatedMinutes: draft.estimatedMinutes,
                importance: draft.importance,
              }
            : task,
        ),
      );
    } else {
      setTasks((prev) => [
        {
          id: crypto.randomUUID(),
          title: trimmedTitle,
          dueDate: new Date(draft.dueDate).toISOString(),
          estimatedMinutes: draft.estimatedMinutes,
          importance: draft.importance,
          completed: false,
        },
        ...prev,
      ]);
    }

    resetDraft();
  };

  const handleEdit = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    setEditingId(id);
    setDraft({
      title: task.title,
      dueDate: task.dueDate.slice(0, 16),
      estimatedMinutes: task.estimatedMinutes,
      importance: task.importance ?? 2,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleComplete = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">DueWise</p>
        <h1>Plan smarter against the clock.</h1>
        <p>Prioritized by time remaining versus effort needed.</p>
      </header>

      <section className="next-up">
        <h2>What should I work on next?</h2>
        {nextTask ? (
          <TaskCard taskUrgency={nextTask} onEdit={handleEdit} onToggleComplete={toggleComplete} compact />
        ) : (
          <p className="empty-state">Add your first task to get a recommendation.</p>
        )}
      </section>

      <section className="form-section">
        <h2>{editingId ? 'Edit Task' : 'Add Task'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              required
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Design review prep"
            />
          </label>
          <label>
            Due date & time
            <input
              required
              type="datetime-local"
              value={draft.dueDate}
              onChange={(event) => setDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
          </label>
          <div className="split-inputs">
            <label>
              Estimated minutes
              <input
                required
                min={5}
                step={5}
                type="number"
                value={draft.estimatedMinutes}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, estimatedMinutes: Number(event.target.value) || 5 }))
                }
              />
            </label>
            <label>
              Importance
              <select
                value={draft.importance}
                onChange={(event) => setDraft((prev) => ({ ...prev, importance: Number(event.target.value) as 1 | 2 | 3 }))}
              >
                <option value={1}>1 — Low</option>
                <option value={2}>2 — Medium</option>
                <option value={3}>3 — High</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Save Changes' : 'Add Task'}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={resetDraft}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="list-section">
        <h2>All Tasks</h2>
        <div className="task-list">
          {sortedTasks.length > 0 ? (
            sortedTasks.map((taskUrgency) => (
              <TaskCard
                key={taskUrgency.task.id}
                taskUrgency={taskUrgency}
                onEdit={handleEdit}
                onToggleComplete={toggleComplete}
              />
            ))
          ) : (
            <p className="empty-state">No tasks yet. Add one above to get started.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default App;
