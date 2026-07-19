import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  timeAgo: string;
  badgeLabel: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'red' | 'zinc' | 'cyan' | 'blue';
  href: string;
}

const colorStyles = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600', dot: 'bg-indigo-500' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', badge: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', badge: 'bg-cyan-50 text-cyan-600', dot: 'bg-cyan-500' },
  zinc: { bg: 'bg-zinc-50', icon: 'text-zinc-600', badge: 'bg-zinc-50 text-zinc-600', dot: 'bg-zinc-400' },
};

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
}

export default function ActivityFeed({ items, title = 'Recent Activity' }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[15px] font-bold text-zinc-900">{title}</h3>
        <a href="#" className="text-[13px] font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors">
          View all <ChevronRight size={14} />
        </a>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">No recent activity</p>
      ) : (
        <div className="relative pl-[1.125rem]">
          {/* Vertical connecting line */}
          <div className="absolute top-4 bottom-4 left-[1.125rem] w-px bg-zinc-200 -z-10" />

          <ul className="space-y-6">
            {items.map((item) => {
              const styles = colorStyles[item.color] || colorStyles.zinc;
              
              return (
                <li key={item.id} className="relative group">
                  <a href={item.href} className="flex items-start gap-4">
                    {/* Small inner dot + Large circle icon */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <div className={`absolute -left-5 h-2 w-2 rounded-full ring-4 ring-white ${styles.dot}`} />
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${styles.bg} ${styles.icon}`}>
                        {item.icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center min-h-[44px] gap-0.5">
                      <h4 className="text-[13px] font-bold text-zinc-900 leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-[12px] text-zinc-500">
                        {item.subtitle}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Right Side: Badge, Time, Link */}
                    <div className="flex items-center gap-4 shrink-0 mt-1">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${styles.badge}`}>
                        {item.badgeLabel}
                      </span>
                      <time className="text-[11px] font-medium text-zinc-400 w-12 text-right">
                        {item.timeAgo}
                      </time>
                      <div className="flex items-center text-[12px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        View <ChevronRight size={14} />
                      </div>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
