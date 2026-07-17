import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import AnalyticsPlaceholder from '@/components/dashboard/AnalyticsPlaceholder';

const stats = [
  { title: 'Total Users', value: '248', icon: '👥', color: 'indigo' as const, trend: { value: '12%', positive: true } },
  { title: 'Active Candidates', value: '84', icon: '🧑‍💼', color: 'emerald' as const, trend: { value: '5%', positive: true } },
  { title: 'Pending Timesheets', value: '17', icon: '🗓️', color: 'amber' as const, subtitle: 'Awaiting review' },
  { title: 'Invoices This Month', value: '31', icon: '📄', color: 'cyan' as const, trend: { value: '8%', positive: true } },
];

const activity: ActivityItem[] = [
  { id: '1', actor: 'Priya Menon', action: 'submitted a timesheet for', target: 'Client ABC — Week 28', time: '2m ago', icon: '📝', color: 'indigo' },
  { id: '2', actor: 'James Carter', action: 'approved timesheet for', target: 'Client XYZ — Week 27', time: '15m ago', icon: '✅', color: 'emerald' },
  { id: '3', actor: 'AI Engine', action: 'generated invoice for', target: 'TechCorp Ltd — June 2026', time: '1h ago', icon: '🤖', color: 'cyan' },
  { id: '4', actor: 'Ravi Kumar', action: 'registered as', target: 'Candidate', time: '3h ago', icon: '👤', color: 'zinc' },
  { id: '5', actor: 'Finance Team', action: 'validated hours for', target: 'Arjun Singh — Week 28', time: '4h ago', icon: '🏦', color: 'amber' },
];

const tasks: Task[] = [
  { id: '1', title: 'Review pending user registrations', priority: 'high', badge: '3 new', dueDate: 'Today' },
  { id: '2', title: 'Audit system configuration', priority: 'medium', description: 'Review security settings', dueDate: 'This week' },
  { id: '3', title: 'Generate monthly summary report', priority: 'low', dueDate: 'Jul 31' },
];

const actions: QuickAction[] = [
  { label: 'Add User', icon: '👤', href: '/dashboard/admin/users/new', color: 'indigo', description: 'Create account' },
  { label: 'View Reports', icon: '📊', href: '/dashboard/admin/reports', color: 'cyan', description: 'Analytics' },
  { label: 'Audit Logs', icon: '📋', href: '/dashboard/admin/audit', color: 'zinc', description: 'Activity trail' },
  { label: 'Invoices', icon: '📄', href: '/dashboard/admin/invoices', color: 'emerald', description: 'Billing' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Platform overview and system management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatsCard key={s.title} {...s} />)}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed items={activity} />
          <AnalyticsPlaceholder title="Platform Analytics" />
        </div>
        <div className="space-y-6">
          <QuickActions actions={actions} />
          <TaskList tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
