import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import AnalyticsPlaceholder from '@/components/dashboard/AnalyticsPlaceholder';

const stats = [
  { title: 'Active Candidates', value: '42', icon: '🧑‍💼', color: 'indigo' as const, trend: { value: '3', positive: true } },
  { title: 'Timesheets Submitted', value: '128', icon: '🗓️', color: 'emerald' as const, subtitle: 'This month' },
  { title: 'Pending Review', value: '7', icon: '⏳', color: 'amber' as const },
  { title: 'Placements', value: '19', icon: '✅', color: 'cyan' as const, trend: { value: '2', positive: true } },
];

const activity: ActivityItem[] = [
  { id: '1', actor: 'Aisha Patel', action: 'submitted a timesheet for', target: 'Week 28', time: '10m ago', icon: '📝', color: 'indigo' },
  { id: '2', actor: 'Client XYZ', action: 'approved timesheet for', target: 'Rahul Mehta', time: '1h ago', icon: '✅', color: 'emerald' },
  { id: '3', actor: 'Dev Kumar', action: 'was added as a candidate for', target: 'TechCorp placement', time: '3h ago', icon: '👤', color: 'zinc' },
];

const tasks: Task[] = [
  { id: '1', title: 'Follow up on 3 rejected timesheets', priority: 'high', dueDate: 'Today' },
  { id: '2', title: 'Onboard new candidate batch', priority: 'medium', badge: '5 candidates', dueDate: 'Jul 20' },
  { id: '3', title: 'Update candidate profiles', priority: 'low', dueDate: 'Jul 25' },
];

const actions: QuickAction[] = [
  { label: 'Add Candidate', icon: '➕', href: '/dashboard/recruiter/candidates/new', color: 'indigo' },
  { label: 'View Timesheets', icon: '🗓️', href: '/dashboard/recruiter/timesheets', color: 'emerald' },
  { label: 'Candidates List', icon: '🧑‍💼', href: '/dashboard/recruiter/candidates', color: 'cyan' },
  { label: 'Reports', icon: '📊', href: '/dashboard/recruiter/reports', color: 'zinc' },
];

export default function RecruiterDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Recruiter Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your candidates and timesheet submissions</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatsCard key={s.title} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed items={activity} />
          <AnalyticsPlaceholder title="Candidate Placement Analytics" />
        </div>
        <div className="space-y-6">
          <QuickActions actions={actions} />
          <TaskList tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
