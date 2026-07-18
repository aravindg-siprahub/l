'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import AnalyticsPlaceholder from '@/components/dashboard/AnalyticsPlaceholder';
import { financeApi, DashboardStats } from '@/lib/finance';

const activity: ActivityItem[] = [
  { id: '1', actor: 'AI Engine', action: 'generated invoice for', target: 'TechCorp — June 2026', time: '1h ago', icon: '🤖', color: 'cyan' },
  { id: '2', actor: 'Finance Team', action: 'validated hours for', target: 'Priya Menon — Week 28', time: '2h ago', icon: '✅', color: 'emerald' },
  { id: '3', actor: 'Finance Team', action: 'flagged discrepancy in', target: 'Rahul Mehta — Week 27', time: '5h ago', icon: '⚠️', color: 'amber' },
];

const tasks: Task[] = [
  { id: '1', title: 'Validate timesheet entries', priority: 'high', badge: 'Pending', dueDate: 'Today' },
  { id: '2', title: 'Approve pending invoices', priority: 'high', badge: 'Action Needed', dueDate: 'Today' },
  { id: '3', title: 'Prepare billing summary', priority: 'medium', dueDate: 'End of Month' },
];

const actions: QuickAction[] = [
  { label: 'Validation Queue', icon: '🔍', href: '/dashboard/finance/timesheets', color: 'amber' },
  { label: 'Invoice Queue', icon: '📄', href: '/dashboard/finance/invoices', color: 'indigo' },
  { label: 'Billing Summary', icon: '💰', href: '/dashboard/finance/billing', color: 'emerald' },
  { label: 'Reports', icon: '📊', href: '/dashboard/finance/reports', color: 'zinc' },
];

export default function FinanceDashboard() {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getDashboardStats()
      .then(setStatsData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { title: 'Validation Queue', value: statsData?.pending_validation?.toString() || '0', icon: '🔍', color: 'amber' as const },
    { title: 'Invoice Queue (Draft/Ready)', value: ((statsData?.draft_invoices || 0) + (statsData?.ready_invoices || 0)).toString(), icon: '📄', color: 'indigo' as const },
    { title: 'Invoices Sent', value: (statsData?.sent_invoices || 0).toString(), icon: '📤', color: 'emerald' as const },
    { title: 'Total Billed (Paid)', value: `$${(statsData?.total_revenue || 0).toLocaleString()}`, icon: '💰', color: 'cyan' as const, trend: { value: 'Paid Invoices', positive: true } },
    { title: 'Outstanding', value: `$${(statsData?.total_outstanding || 0).toLocaleString()}`, icon: '⏳', color: 'red' as const }
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <svg className="animate-spin h-6 w-6 text-indigo-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Finance Team Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Validation queue, invoicing, and billing management</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
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
