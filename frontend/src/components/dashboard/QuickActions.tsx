import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'cyan' | 'zinc';
  description?: string;
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-500/10',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10',
  amber: 'bg-amber-50 text-amber-600 ring-amber-500/10',
  red: 'bg-red-50 text-red-600 ring-red-500/10',
  cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-500/10',
  zinc: 'bg-zinc-50 text-zinc-600 ring-zinc-500/10',
};

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export default function QuickActions({ actions, title = 'Quick Actions' }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <h3 className="text-sm font-bold text-zinc-900 mb-4">{title}</h3>
      <div className="flex flex-col gap-2">
        {actions.map(action => (
          <a
            key={action.label}
            href={action.href}
            className="group flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50/80 transition-all border border-transparent hover:border-zinc-200/60"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-transform group-hover:scale-105 ${colorMap[action.color ?? 'zinc']}`}>
                {action.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                  {action.label}
                </span>
                {action.description && (
                  <span className="text-[11px] text-zinc-500 mt-0.5">
                    {action.description}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </a>
        ))}
      </div>
    </div>
  );
}
