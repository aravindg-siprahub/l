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
  statusLabel?: string;
}

const dotColor = {
  indigo: 'border-indigo-500 text-indigo-500',
  emerald: 'border-emerald-500 text-emerald-500',
  amber: 'border-amber-500 text-amber-500',
  red: 'border-red-500 text-red-500',
  zinc: 'border-zinc-400 text-zinc-400',
  cyan: 'border-cyan-500 text-cyan-500',
};

const badgeColor = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  zinc: 'bg-zinc-50 text-zinc-600',
  cyan: 'bg-cyan-50 text-cyan-600',
};

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
}

export default function ActivityFeed({ items, title = 'Recent Activity' }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
        <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View all →</a>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">No recent activity</p>
      ) : (
        <ol className="relative border-l border-zinc-100 space-y-6 ml-2">
          {items.map((item, idx) => (
            <li key={item.id} className="ml-6">
              <span className={`absolute -left-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 bg-white ${dotColor[item.color ?? 'zinc']}`}>
                <span className="text-[10px]">{item.icon}</span>
              </span>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-bold text-zinc-900">
                    {item.action} {item.target}
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-1">
                    {item.actor} • {item.time}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {item.statusLabel && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeColor[item.color ?? 'zinc']}`}>
                      {item.statusLabel}
                    </span>
                  )}
                  <time className="shrink-0 text-[11px] text-zinc-400 font-medium w-16 text-right">
                    {item.time}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
