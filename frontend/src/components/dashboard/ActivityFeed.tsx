/**
 * Recent Activity Feed component for dashboards — light theme only.
 */
export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  icon: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'zinc' | 'cyan';
}

const dotColor = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  zinc: 'bg-zinc-400',
  cyan: 'bg-cyan-500',
};

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
}

export default function ActivityFeed({ items, title = 'Recent Activity' }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900 mb-5">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">No recent activity</p>
      ) : (
        <ol className="relative border-l border-zinc-200 space-y-5 ml-2">
          {items.map(item => (
            <li key={item.id} className="ml-5">
              <span className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${dotColor[item.color ?? 'zinc']}`}>
                <span className="sr-only">{item.action}</span>
              </span>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-600">
                    <span className="font-medium text-zinc-900">{item.actor}</span>{' '}
                    {item.action}{' '}
                    <span className="font-medium text-indigo-600">{item.target}</span>
                  </p>
                </div>
                <time className="shrink-0 text-xs text-zinc-400">{item.time}</time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
