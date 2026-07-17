import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import AnalyticsPlaceholder from '@/components/dashboard/AnalyticsPlaceholder';

const stats = [
  { title: 'Pending Approvals', value: '9', icon: '⏳', color: 'amber' as const },
  { title: 'Approved This Month', value: '54', icon: '✅', color: 'emerald' as const },
  { title: 'Rejected', value: '3', icon: '❌', color: 'red' as const, subtitle: 'This month' },
  { title: 'Active Contractors', value: '21', icon: '🧑‍💼', color: 'indigo' as const },
];

const activity: ActivityItem[] = [
  { id: '1', actor: 'Priya Menon', action: 'submitted timesheet for', target: 'Week 28', time: '30m ago', icon: '📝', color: 'indigo' },
  { id: '2', actor: 'You', action: 'approved timesheet for', target: 'Arjun Singh — Week 27', time: '2h ago', icon: '✅', color: 'emerald' },
  { id: '3', actor: 'You', action: 'rejected timesheet for', target: 'Dev Kumar — Week 26', time: '1d ago', icon: '❌', color: 'red' },
];

const tasks: Task[] = [
  { id: '1', title: 'Review 9 pending timesheets', priority: 'high', badge: '9 items', dueDate: 'Today' },
  { id: '2', title: 'Respond to Recruiter query — Week 25', priority: 'medium', dueDate: 'Jul 19' },
];

const actions: QuickAction[] = [
  { label: 'Pending Approvals', icon: '⏳', href: '/dashboard/client-manager/approvals', color: 'amber' },
  { label: 'Approval History', icon: '📋', href: '/dashboard/client-manager/history', color: 'zinc' },
];

export default function ClientManagerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Client Manager Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Timesheet approvals and contractor oversight</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatsCard key={s.title} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed items={activity} title="Approval Activity" />
          <AnalyticsPlaceholder title="Approval Rate Analytics" />
        </div>
        <div className="space-y-6">
          <QuickActions actions={actions} />
          <TaskList tasks={tasks} title="Action Required" />
        </div>
      </div>
    </div>
  );
}
