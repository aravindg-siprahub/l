import React from 'react';

export function Timeline({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`relative space-y-6 ${className}`}>{children}</div>;
}

interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string | React.ReactNode;
  rightContent?: React.ReactNode;
  isLast?: boolean;
  className?: string;
}

export function TimelineItem({ icon, title, subtitle, rightContent, isLast, className = '' }: TimelineItemProps) {
  return (
    <div className={`relative flex gap-4 ${className}`}>
      {/* Vertical Line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-zinc-200 dark:bg-zinc-800 transform -translate-x-1/2"></div>
      )}
      
      {/* Icon */}
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col sm:flex-row sm:items-start justify-between pb-1 gap-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
          {subtitle && <div className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div>}
        </div>
        {rightContent && <div className="text-sm text-zinc-500 dark:text-zinc-400 sm:text-right">{rightContent}</div>}
      </div>
    </div>
  );
}
