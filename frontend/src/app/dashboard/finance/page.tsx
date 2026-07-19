'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { 
  FileText, CircleDollarSign, BarChart3, Search, Clock, CheckCircle2, 
  Send, Calendar, AlertCircle, FileStack
} from 'lucide-react';

import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import TaskList, { Task } from '@/components/dashboard/TaskList';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import FinanceTrendChart from '@/components/dashboard/FinanceTrendChart';
import { financeApi, DashboardStats, FinanceTrendDataPoint } from '@/lib/finance';
import { invoicesApi, InvoiceListItem } from '@/lib/invoices';
import { Timesheet } from '@/lib/timesheets';

const actions: QuickAction[] = [
  { label: 'Validation Queue', description: 'Timesheets to review', icon: <Search size={18} strokeWidth={1.75} />, href: '/dashboard/finance/timesheets', color: 'amber' },
  { label: 'Invoice Queue', description: 'Drafts and Ready', icon: <FileText size={18} strokeWidth={1.75} />, href: '/dashboard/finance/invoices', color: 'indigo' },
  { label: 'Billing Summary', description: 'Revenue tracking', icon: <CircleDollarSign size={18} strokeWidth={1.75} />, href: '/dashboard/finance/billing', color: 'emerald' },
  { label: 'Reports', description: 'Financial analytics', icon: <BarChart3 size={18} strokeWidth={1.75} />, href: '#', color: 'zinc' },
];

export default function FinanceDashboard() {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [pendingData, setPendingData] = useState<Timesheet[]>([]);
  const [invoicesData, setInvoicesData] = useState<InvoiceListItem[]>([]);
  const [trendData, setTrendData] = useState<FinanceTrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      financeApi.getDashboardStats().then(setStatsData),
      financeApi.getPending().then(setPendingData),
      invoicesApi.getAll().then(setInvoicesData),
      financeApi.getTrendData().then(res => setTrendData(res.data))
    ]).finally(() => setLoading(false));
  }, []);

  const stats = [
    { title: 'Validation Queue', value: statsData?.pending_validation?.toString() || '0', icon: <Clock size={18} strokeWidth={1.75} />, color: 'amber' as const },
    { title: 'Invoice Queue (Draft/Ready)', value: ((statsData?.draft_invoices || 0) + (statsData?.ready_invoices || 0)).toString(), icon: <FileStack size={18} strokeWidth={1.75} />, color: 'indigo' as const },
    { title: 'Invoices Sent', value: (statsData?.sent_invoices || 0).toString(), icon: <Send size={18} strokeWidth={1.75} />, color: 'emerald' as const },
    { title: 'Total Billed (Paid)', value: `$${(statsData?.total_revenue || 0).toLocaleString()}`, icon: <CheckCircle2 size={18} strokeWidth={1.75} />, color: 'cyan' as const, trend: { value: 'Paid Invoices', positive: true } },
    { title: 'Outstanding', value: `$${(statsData?.total_outstanding || 0).toLocaleString()}`, icon: <AlertCircle size={18} strokeWidth={1.75} />, color: 'red' as const }
  ];

  const tasks: Task[] = pendingData.slice(0, 5).map(ts => ({
    id: ts.id,
    title: `Validate: ${ts.candidate_name || 'Timesheet'}`,
    description: `For period ${format(parseISO(ts.period_start_date), 'MMM d')} - ${format(parseISO(ts.period_end_date), 'MMM d, yyyy')}`,
    priority: 'high',
    badge: 'Pending',
    dueDate: 'Today'
  }));

  const activities: ActivityItem[] = invoicesData.slice(0, 8).map(inv => {
    let title = 'Invoice Generated';
    let icon = <FileText size={18} strokeWidth={1.75} />;
    let color: ActivityItem['color'] = 'zinc';
    let badgeLabel = inv.status;
    
    if (inv.status === 'draft') {
      title = `Draft created for ${inv.invoice_number}`;
      color = 'zinc';
    } else if (inv.status === 'ready') {
      title = `Invoice ${inv.invoice_number} ready to send`;
      color = 'amber';
    } else if (inv.status === 'sent') {
      title = `Invoice ${inv.invoice_number} sent`;
      color = 'indigo';
      icon = <Send size={18} strokeWidth={1.75} />;
    } else if (inv.status === 'paid') {
      title = `Payment received for ${inv.invoice_number}`;
      color = 'emerald';
      icon = <CheckCircle2 size={18} strokeWidth={1.75} />;
    }

    return {
      id: inv.id,
      title,
      subtitle: `${format(parseISO(inv.period_start_date), 'MMM d')} - ${format(parseISO(inv.period_end_date), 'MMM d, yyyy')} • $${inv.total_amount.toLocaleString()}`,
      description: `Generated for candidate ID: ${inv.candidate_id.split('-')[0]}`,
      timeAgo: formatDistanceToNow(parseISO(inv.created_at), { addSuffix: true }),
      badgeLabel: badgeLabel.charAt(0).toUpperCase() + badgeLabel.slice(1),
      icon,
      color,
      href: `/dashboard/finance/invoices/${inv.id}`,
    };
  });

  const today = new Date();
  const dateRangeStr = `${format(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), 'MMM d')} - ${format(today, 'MMM d, yyyy')}`;

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Good morning, Finance Team</h2>
          <p className="mt-1 text-sm text-zinc-500">Here's the current state of billing and invoicing.</p>
        </div>
        
        {/* Date picker placeholder */}
        <button className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors">
          <Calendar size={14} className="text-zinc-400" />
          {dateRangeStr}
          <span className="text-zinc-400 ml-1 text-[10px]">▼</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => <StatsCard key={s.title} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FinanceTrendChart data={trendData} />
          <ActivityFeed items={activities} title="Recent Invoicing Activity" />
        </div>
        <div className="space-y-6">
          <QuickActions actions={actions} />
          <TaskList tasks={tasks} title="Validation Queue" />
        </div>
      </div>
    </div>
  );
}
