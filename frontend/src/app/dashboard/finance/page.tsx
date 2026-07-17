import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import AnalyticsPlaceholder from '@/components/dashboard/AnalyticsPlaceholder';

const stats = [
  { title: 'Validation Queue', value: '14', icon: '🔍', color: 'amber' as const },
  { title: 'Invoice Queue', value: '6', icon: '📄', color: 'indigo' as const },
  { title: 'Invoices Approved', value: '43', icon: '✅', color: 'emerald' as const, subtitle: 'This month' },
  { title: 'Total Billed', value: '₹8.4L', icon: '💰', color: 'cyan' as const, trend: { value: '12%', positive: true } },
];

const activity: ActivityItem[] = [
  { id: '1', actor: 'AI Engine', action: 'generated invoice for', target: 'TechCorp — June 2026', time: '1h ago', icon: '🤖', color: 'cyan' },
  { id: '2', actor: 'Finance Team', action: 'validated hours for', target: 'Priya Menon — Week 28', time: '2h ago', icon: '✅', color: 'emerald' },
  { id: '3', actor: 'Finance Team', action: 'flagged discrepancy in', target: 'Rahul Mehta — Week 27', time: '5h ago', icon: '⚠️', color: 'amber' },
];

const tasks: Task[] = [
  { id: '1', title: 'Validate 14 timesheet entries', priority: 'high', badge: '14 items', dueDate: 'Today' },
  { id: '2', title: 'Approve 6 pending invoices', priority: 'high', badge: '6 invoices', dueDate: 'Today' },
  { id: '3', title: 'Prepare billing summary — July', priority: 'medium', dueDate: 'Jul 31' },
];

const actions: QuickAction[] = [
  { label: 'Validation Queue', icon: '🔍', href: '/dashboard/finance/timesheets', color: 'amber' },
  { label: 'Invoice Queue', icon: '📄', href: '/dashboard/finance/invoices', color: 'indigo' },
  { label: 'Billing Summary', icon: '💰', href: '/dashboard/finance/billing', color: 'emerald' },
  { label: 'Reports', icon: '📊', href: '/dashboard/finance/reports', color: 'zinc' },
];

export default function FinanceDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Finance Team Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Validation queue, invoicing, and billing management</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatsCard key={s.title} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed items={activity} title="Finance Activity" />
          <AnalyticsPlaceholder title="Billing & Invoice Analytics" />
        </div>
        <div className="space-y-6">
          <QuickActions actions={actions} />
          <TaskList tasks={tasks} title="Finance Queue" />
        </div>
      </div>
    </div>
  );
}
