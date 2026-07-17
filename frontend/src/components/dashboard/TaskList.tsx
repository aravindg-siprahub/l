/**
 * Pending Task List — light theme only.
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  badge?: string;
}

const priorityStyle = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-zinc-50 text-zinc-600 border-zinc-200',
};

const priorityDot = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-zinc-400',
};

interface TaskListProps {
  tasks: Task[];
  title?: string;
}

export default function TaskList({ tasks, title = 'Pending Tasks' }: TaskListProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">All caught up! 🎉</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map(task => (
            <li key={task.id} className={`rounded-xl border p-4 ${priorityStyle[task.priority]}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot[task.priority]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{task.title}</p>
                  {task.description && (
                    <p className="mt-0.5 text-xs text-zinc-500 truncate">{task.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {task.badge && (
                      <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-zinc-600 border border-zinc-200">
                        {task.badge}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-zinc-400">Due {task.dueDate}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
