'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, Timer, FileText, ClipboardList, UserCircle, BarChart3, Share2, Send } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import AnalyticsPlaceholder from '@/components/dashboard/AnalyticsPlaceholder';
import TrendChart from '@/components/dashboard/TrendChart';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import { clientManagerApi, ClientManagerStats, PaginatedTimesheetResponse, TrendDataPoint, RecentActivityOut } from '@/lib/client-manager';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

const actions: QuickAction[] = [
  { label: 'Pending Approvals', description: '12 items', icon: <Clock size={18} strokeWidth={2.5} />, href: '/dashboard/client-manager/timesheets', color: 'indigo' },
  { label: 'Approval History', description: 'View all', icon: <ClipboardList size={18} strokeWidth={2.5} />, href: '/dashboard/client-manager/history', color: 'indigo' },
  { label: 'My Profile', description: 'Manage details', icon: <UserCircle size={18} strokeWidth={2.5} />, href: '/dashboard/profile', color: 'emerald' },
  { label: 'Reports', description: 'View analytics', icon: <BarChart3 size={18} strokeWidth={2.5} />, href: '#', color: 'amber' },
];

export default function ClientManagerDashboard() {
  const [stats, setStats]       = useState<ClientManagerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [pendingData, setPendingData] = useState<PaginatedTimesheetResponse | null>(null);
  const [activityData, setActivityData] = useState<RecentActivityOut[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  useEffect(() => {
    clientManagerApi.getStats()
      .then(data => setStats(data))
      .catch((err) => {
        console.error("Failed to fetch client stats:", err);
      })
      .finally(() => setStatsLoading(false));
      
    // Fetch top 5 pending for TaskList
    clientManagerApi.getPending({ page_size: 5 })
      .then(data => setPendingData(data))
      .catch(() => {});
      
    // Fetch top 10 recent activities for ActivityFeed
    clientManagerApi.getRecentActivity()
      .then(data => setActivityData(data))
      .catch(() => {});
      
    // Fetch trend data
    clientManagerApi.getTrendData()
      .then(data => setTrendData(data.data))
      .catch(() => {});
  }, []);

  const tasks: Task[] = (pendingData?.items || []).map(ts => ({
    id: ts.id,
    title: `Review Timesheet: ${ts.candidate_name || 'Unknown Candidate'}`,
    description: `For period ${ts.period_start_date} to ${ts.period_end_date}`,
    priority: 'high',
    badge: `${ts.total_hours} Hours`,
    dueDate: ts.submitted_at ? format(parseISO(ts.submitted_at), 'MMM d, yyyy') : undefined,
  }));

  const activities: ActivityItem[] = activityData.map(log => {
    let title = 'Unknown action';
    let icon = <CheckCircle2 size={18} strokeWidth={2.5} />;
    let color: ActivityItem['color'] = 'zinc';
    let badgeLabel = 'Action';
    let subtitle = `${format(parseISO(log.period_start_date), 'MMM d')} - ${format(parseISO(log.period_end_date), 'MMM d, yyyy')} • ${log.total_hours} Hours`;
    let description = '';

    if (log.action === 'submitted' || log.action === 'resubmitted') {
      title = 'Timesheet submitted';
      description = `Submitted for approval by ${log.candidate_name}`;
      badgeLabel = 'Submitted';
      color = 'blue';
      icon = <Send size={18} strokeWidth={2.5} />;
    } else if (log.action === 'shared') {
      title = 'Timesheet shared';
      description = `Shared with you by ${log.candidate_name}`;
      badgeLabel = 'Shared';
      color = 'indigo';
      icon = <Share2 size={18} strokeWidth={2.5} />;
    } else if (log.action === 'client_approved') {
      title = 'Timesheet approved by you';
      description = `Approved by ${log.actor_name || 'You'}`;
      badgeLabel = 'Approved';
      color = 'emerald';
      icon = <CheckCircle2 size={18} strokeWidth={2.5} />;
    } else if (log.action === 'client_rejected') {
      title = 'Timesheet rejected by you';
      description = `Rejected by ${log.actor_name || 'You'}`;
      badgeLabel = 'Rejected';
      color = 'red';
      icon = <XCircle size={18} strokeWidth={2.5} />;
    }

    return {
      id: log.id,
      title,
      subtitle,
      description,
      timeAgo: formatDistanceToNow(parseISO(log.created_at), { addSuffix: true }),
      badgeLabel,
      icon,
      color,
      href: `/dashboard/client-manager/timesheets/${log.timesheet_id}`,
    };
  });

  const statCards = [
    {
      title: 'Pending Approvals',
      value: statsLoading ? '…' : String(stats?.pending ?? 0),
      icon: <Clock size={20} strokeWidth={2.5} />,
      color: 'amber' as const,
    },
    {
      title: 'Approved This Month',
      value: statsLoading ? '…' : String(stats?.approved_this_month ?? 0),
      icon: <CheckCircle2 size={20} strokeWidth={2.5} />,
      color: 'emerald' as const,
    },
    {
      title: 'Rejected This Month',
      value: statsLoading ? '…' : String(stats?.rejected_this_month ?? 0),
      icon: <XCircle size={20} strokeWidth={2.5} />,
      color: 'red' as const,
    },
    {
      title: 'Avg. Approval Time',
      value: statsLoading ? '…' : (stats?.avg_approval_time_hours || '0h'),
      icon: <Timer size={20} strokeWidth={2.5} />,
      color: 'indigo' as const,
    },
    {
      title: 'Total Timesheets',
      value: statsLoading ? '…' : String(stats?.total_timesheets ?? 0),
      icon: <FileText size={20} strokeWidth={2.5} />,
      color: 'cyan' as const,
    },
  ];

  const today = new Date();
  const dateRangeStr = `${format(new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000), 'MMM d')} - ${format(today, 'MMM d, yyyy')}`;



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Good morning, kumar</h2>
          <p className="mt-1 text-sm text-zinc-500">Here's what's happening with your timesheet approvals.</p>
        </div>
        
        {/* Date picker placeholder */}
        <button className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors">
          <span className="text-zinc-400">📅</span>
          {dateRangeStr}
          <span className="text-zinc-400 ml-1 text-xs">▼</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statCards.map(s => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {trendData.length > 0 ? (
            <TrendChart data={trendData} />
          ) : (
            <AnalyticsPlaceholder title="Approval Trend" />
          )}
        </div>
        <div>
          <QuickActions actions={actions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed items={activities} title="Approval Activity" />
        </div>
        <div>
          <TaskList tasks={tasks} title="Action Required" />
        </div>
      </div>
    </div>
  );
}
