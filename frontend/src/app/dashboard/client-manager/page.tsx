'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import AnalyticsPlaceholder from '@/components/dashboard/AnalyticsPlaceholder';
import { clientManagerApi, ClientManagerStats } from '@/lib/client-manager';

const placeholderActivity: ActivityItem[] = [];

const tasks: Task[] = [];

const actions: QuickAction[] = [
  { label: 'Pending Approvals', icon: '⏳', href: '/dashboard/client-manager/timesheets', color: 'amber' },
  { label: 'Approval History',  icon: '📋', href: '/dashboard/client-manager/history',    color: 'zinc' },
];

export default function ClientManagerDashboard() {
  const [stats, setStats]       = useState<ClientManagerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    clientManagerApi.getStats()
      .then(data => setStats(data))
      .catch(() => {/* non-critical — stats show '…' if unavailable */})
      .finally(() => setStatsLoading(false));
  }, []);

  const statCards = [
    {
      title: 'Pending Approvals',
      value: statsLoading ? '…' : String(stats?.pending ?? 0),
      icon: '⏳',
      color: 'amber' as const,
      subtitle: 'Awaiting your review',
    },
    {
      title: 'Approved This Month',
      value: statsLoading ? '…' : String(stats?.approved_this_month ?? 0),
      icon: '✅',
      color: 'emerald' as const,
    },
    {
      title: 'Rejected This Month',
      value: statsLoading ? '…' : String(stats?.rejected_this_month ?? 0),
      icon: '❌',
      color: 'red' as const,
      subtitle: 'Returned to candidate',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Client Manager Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500">Timesheet approvals and contractor oversight</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map(s => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed items={placeholderActivity} title="Approval Activity" />
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
