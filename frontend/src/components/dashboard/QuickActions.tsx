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
  indigo: 'text-indigo-500',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  red: 'text-red-500',
  cyan: 'text-cyan-500',
  zinc: 'text-zinc-500',
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
            <div className="flex items-center gap-3">
              <div className={`flex shrink-0 items-center justify-center transition-transform group-hover:scale-105 ${colorMap[action.color ?? 'zinc']}`}>
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
