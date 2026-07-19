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
  scrollable?: boolean;
}

export default function ActivityFeed({ items, title = 'Recent Activity', scrollable = false }: ActivityFeedProps) {
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
        <div className={`relative ${scrollable ? 'max-h-[400px] overflow-y-auto pr-4 -mr-2 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent' : ''}`}>
          {/* Vertical connecting line through the center of icons */}
          <div className="absolute top-[22px] bottom-[22px] left-[21.5px] w-px bg-zinc-200" />

          <ul className="space-y-6">
            {items.map((item) => {
              const styles = colorStyles[item.color] || colorStyles.zinc;
              
              return (
                <li key={item.id} className="relative group">
                  <a href={item.href} className="flex items-start gap-4 p-2 -m-2 rounded-xl hover:bg-zinc-50/50 transition-colors">
                    {/* Large circle icon with white ring to cover the line behind it */}
                    <div className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${styles.bg} ${styles.icon}`}>
                      {item.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center min-h-[44px] gap-0.5">
                      <h4 className="text-[13px] font-bold text-zinc-900 leading-tight group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[12px] text-zinc-500">
                        {item.subtitle}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-zinc-400">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Right Side: Badge, Time */}
                    <div className="flex items-center justify-end gap-3 shrink-0 h-[44px]">
                      {item.badgeLabel && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}>
                          {item.badgeLabel}
                        </span>
                      )}
                      <time className="text-[11px] font-medium text-zinc-400 whitespace-nowrap text-right min-w-[70px]">
                        {item.timeAgo}
                      </time>
                      <div className="hidden sm:flex items-center text-[12px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        <ChevronRight size={14} />
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
