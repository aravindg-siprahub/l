/**
 * Reusable Stats Card — light theme only.
 */
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: { value: string; positive: boolean };
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'cyan';
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-600 ring-amber-200',
  red: 'bg-red-50 text-red-600 ring-red-200',
  cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-200',
};

export default function StatsCard({ title, value, subtitle, icon, trend, color = 'indigo' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 text-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-xs text-zinc-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
