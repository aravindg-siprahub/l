import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';

const stats = [
  { title: 'Timesheets Submitted', value: '12', icon: '🗓️', color: 'indigo' as const, subtitle: 'This month' },
  { title: 'Approved', value: '9', icon: '✅', color: 'emerald' as const },
  { title: 'Pending', value: '2', icon: '⏳', color: 'amber' as const },
  { title: 'Rejected', value: '1', icon: '❌', color: 'red' as const },
];

const activity: ActivityItem[] = [
  { id: '1', actor: 'You', action: 'submitted timesheet for', target: 'Week 28', time: '1h ago', icon: '📝', color: 'indigo' },
  { id: '2', actor: 'Client ABC', action: 'approved your timesheet for', target: 'Week 27', time: '1d ago', icon: '✅', color: 'emerald' },
  { id: '3', actor: 'Client XYZ', action: 'rejected your timesheet for', target: 'Week 26', time: '3d ago', icon: '❌', color: 'red' },
];

const tasks: Task[] = [
  { id: '1', title: 'Resubmit rejected timesheet — Week 26', priority: 'high', description: 'Add correct hours', dueDate: 'Today' },
  { id: '2', title: 'Submit timesheet for Week 29', priority: 'medium', dueDate: 'Jul 22' },
];

const actions: QuickAction[] = [
  { label: 'Submit Timesheet', icon: '➕', href: '/dashboard/candidate/timesheets/new', color: 'indigo', description: 'New submission' },
  { label: 'My Timesheets', icon: '🗓️', href: '/dashboard/candidate/timesheets', color: 'zinc', description: 'View history' },
  { label: 'My Profile', icon: '👤', href: '/dashboard/candidate/profile', color: 'emerald', description: 'Update info' },
];

export default function CandidateDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Track your timesheet submissions and approvals</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatsCard key={s.title} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed items={activity} title="My Activity" />
        </div>
        <div className="space-y-6">
          <QuickActions actions={actions} />
          <TaskList tasks={tasks} title="Action Required" />
        </div>
      </div>
    </div>
  );
}
