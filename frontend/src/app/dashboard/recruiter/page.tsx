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
  { id: '1', title: 'Aisha Patel', subtitle: 'Submitted a timesheet for Week 28', description: '', timeAgo: '10m ago', badgeLabel: 'Timesheet', icon: '📝', color: 'indigo', href: '#' },
  { id: '2', title: 'Client XYZ', subtitle: 'Approved timesheet for Rahul Mehta', description: '', timeAgo: '1h ago', badgeLabel: 'Approval', icon: '✅', color: 'emerald', href: '#' },
  { id: '3', title: 'Dev Kumar', subtitle: 'Was added as a candidate for TechCorp placement', description: '', timeAgo: '3h ago', badgeLabel: 'New Candidate', icon: '👤', color: 'zinc', href: '#' },
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
