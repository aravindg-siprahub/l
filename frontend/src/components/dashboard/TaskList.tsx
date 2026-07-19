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
  high: 'bg-transparent',
  medium: 'bg-transparent',
  low: 'bg-transparent',
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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">
            {tasks.length}
          </span>
        </div>
        <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View all →</a>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">All caught up! 🎉</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {tasks.map(task => (
            <li key={task.id} className="group flex items-center justify-between py-4 hover:bg-zinc-50/50 transition-colors">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${priorityDot[task.priority]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 truncate">{task.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {task.description && (
                      <p className="text-[12px] text-zinc-500 truncate">{task.description}</p>
                    )}
                    {task.badge && (
                      <>
                        <span className="text-[10px] text-zinc-300 shrink-0">•</span>
                        <span className="text-[12px] text-zinc-500 shrink-0">{task.badge}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-4 shrink-0">
                {task.dueDate && (
                  <span className="rounded-md bg-indigo-50/50 px-2 py-1 text-[11px] font-semibold text-indigo-600 border border-indigo-100/50 whitespace-nowrap">
                    Due {task.dueDate}
                  </span>
                )}
                <span className="text-zinc-400 group-hover:text-zinc-600 transition-colors">
                  →
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
