/**
 * Reusable Stats Card — light theme only.
 */
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'cyan' | 'blue' | 'violet' | 'zinc';
}

const colorStyles = {
  indigo: { text: 'text-indigo-500', grad: 'from-indigo-500/10' },
  emerald: { text: 'text-emerald-500', grad: 'from-emerald-500/10' },
  amber: { text: 'text-amber-500', grad: 'from-amber-500/10' },
  red: { text: 'text-red-500', grad: 'from-red-500/10' },
  cyan: { text: 'text-cyan-500', grad: 'from-cyan-500/10' },
  blue: { text: 'text-blue-500', grad: 'from-blue-500/10' },
  violet: { text: 'text-violet-500', grad: 'from-violet-500/10' },
  zinc: { text: 'text-zinc-500', grad: 'from-zinc-500/10' },
};

export default function StatsCard({ title, value, subtitle, icon, color = 'indigo' }: StatsCardProps) {
  const { text: textClass, grad: gradientClass } = colorStyles[color];

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-zinc-200/60 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group">
      {/* Subtle corner gradient decoration */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-bl ${gradientClass} to-transparent rounded-full opacity-60 group-hover:scale-110 transition-transform duration-500`} />
      
      <div className="relative z-10 flex items-center gap-2 mb-3">
        <div className={`flex items-center justify-center flex-shrink-0 ${textClass}`}>
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 truncate">{title}</p>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight leading-none">
          {value}
        </h3>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-400 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}
