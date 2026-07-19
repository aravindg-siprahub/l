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
  indigo: 'bg-indigo-50 text-indigo-600 from-indigo-500/10',
  emerald: 'bg-emerald-50 text-emerald-600 from-emerald-500/10',
  amber: 'bg-amber-50 text-amber-600 from-amber-500/10',
  red: 'bg-red-50 text-red-600 from-red-500/10',
  cyan: 'bg-cyan-50 text-cyan-600 from-cyan-500/10',
  blue: 'bg-blue-50 text-blue-600 from-blue-500/10',
  violet: 'bg-violet-50 text-violet-600 from-violet-500/10',
  zinc: 'bg-zinc-100 text-zinc-600 from-zinc-500/10',
};

export default function StatsCard({ title, value, subtitle, icon, color = 'indigo' }: StatsCardProps) {
  const colorClass = colorStyles[color];
  const [bgClass, textClass, gradientClass] = colorClass.split(' ');

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5 hover:border-zinc-300 transition-all duration-300 group">
      {/* Subtle corner gradient decoration */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-bl ${gradientClass} to-transparent rounded-full opacity-60 group-hover:scale-110 transition-transform duration-500`} />
      
      <div className="relative z-10 flex items-start justify-between mb-4">
        <p className="text-[13px] font-semibold text-zinc-500 tracking-wide">{title}</p>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bgClass} ${textClass} ring-1 ring-inset ring-black/5`}>
          {icon}
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-none">
          {value}
        </h3>
        {subtitle && <p className="text-[11px] font-medium text-zinc-400 mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}
