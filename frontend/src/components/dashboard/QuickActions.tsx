/**
 * Quick Actions panel — light theme only.
 */
export interface QuickAction {
  label: string;
  icon: string;
  href: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'cyan' | 'zinc';
  description?: string;
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
  red: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
  cyan: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200',
  zinc: 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border-zinc-200',
};

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export default function QuickActions({ actions, title = 'Quick Actions' }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900 mb-5">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => (
          <a
            key={action.label}
            href={action.href}
            className={`flex flex-col items-start gap-2 rounded-xl border p-4 transition-colors ${colorMap[action.color ?? 'zinc']}`}
          >
            <span className="text-2xl">{action.icon}</span>
            <div>
              <p className="text-sm font-semibold">{action.label}</p>
              {action.description && (
                <p className="mt-0.5 text-xs opacity-70">{action.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
