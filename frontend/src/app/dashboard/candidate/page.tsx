'use client';

import { useState, useEffect, useMemo } from 'react';
import { Timesheet, timesheetsApi } from '@/lib/timesheets';
import Link from 'next/link';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { apiMe, UserOut } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Timeline, TimelineItem } from '@/components/ui/Timeline';
import { 
  FileText, 
  SendHorizontal, 
  Share2, 
  CheckCircle, 
  XCircle,
  Calendar,
  PlusCircle,
  UserCircle,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Minus
} from 'lucide-react';

export default function CandidateDashboard() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('access_token') || '';
        const [data, u] = await Promise.all([
          timesheetsApi.getAll(),
          apiMe(token)
        ]);
        setTimesheets(data);
        setUser(u);
      } catch (err: any) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const draft = timesheets.filter(t => t.status === 'draft').length;
    const submitted = timesheets.filter(t => t.status === 'submitted' && !t.shared_at).length;
    const shared = timesheets.filter(t => t.shared_at).length;
    const approved = timesheets.filter(t => t.status === 'client_approved' || t.status === 'finance_approved').length;
    const rejected = timesheets.filter(t => t.status === 'client_rejected' || t.status === 'finance_rejected').length;

    return [
      { title: 'Draft', value: draft.toString(), icon: <FileText size={18} strokeWidth={2} className="text-indigo-500" />, accent: 'bg-indigo-500', trend: <Minus size={14} className="mr-1 text-zinc-400" />, trendText: 'vs last 30 days' },
      { title: 'Submitted', value: submitted.toString(), icon: <SendHorizontal size={18} strokeWidth={2} className="text-blue-500" />, accent: 'bg-blue-500', trend: <Minus size={14} className="mr-1 text-zinc-400" />, trendText: 'vs last 30 days' },
      { title: 'Shared', value: shared.toString(), icon: <Share2 size={18} strokeWidth={2} className="text-orange-500" />, accent: 'bg-orange-500', trend: <TrendingUp size={14} className="mr-1 text-emerald-500" />, trendText: '100% vs last 30 days', trendClass: 'text-emerald-600 dark:text-emerald-400' },
      { title: 'Approved', value: approved.toString(), icon: <CheckCircle size={18} strokeWidth={2} className="text-emerald-500" />, accent: 'bg-emerald-500', trend: <TrendingUp size={14} className="mr-1 text-emerald-500" />, trendText: '100% vs last 30 days', trendClass: 'text-emerald-600 dark:text-emerald-400' },
      { title: 'Rejected', value: rejected.toString(), icon: <XCircle size={18} strokeWidth={2} className="text-red-500" />, accent: 'bg-red-500', trend: <Minus size={14} className="mr-1 text-zinc-400" />, trendText: 'vs last 30 days' },
    ];
  }, [timesheets]);

  const rejectedTimesheets = useMemo(
    () =>
      [...timesheets]
        .filter(t => t.status === 'client_rejected' || t.status === 'finance_rejected')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [timesheets],
  );

  const recentTimesheets = useMemo(() => {
    return [...timesheets]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 50);
  }, [timesheets]);



  const getStatusDetails = (ts: Timesheet) => {
    if (ts.status === 'client_rejected' || ts.status === 'finance_rejected') {
      return { label: 'Rejected', badge: 'danger' as const, icon: <XCircle size={14} className="text-red-600" />, desc: 'Rejected in review' };
    }
    if (ts.status === 'client_approved' || ts.status === 'finance_approved') {
      return { label: 'Approved', badge: 'success' as const, icon: <CheckCircle size={14} className="text-emerald-600" />, desc: 'Approved in workflow' };
    }
    if (ts.shared_at) {
      return { label: 'Shared', badge: 'warning' as const, icon: <Share2 size={14} className="text-amber-600" />, desc: 'Shared with Client Manager' };
    }
    if (ts.status === 'submitted') {
      return { label: 'Submitted', badge: 'info' as const, icon: <SendHorizontal size={14} className="text-blue-600" />, desc: 'Awaiting review' };
    }
    return { label: 'Draft', badge: 'default' as const, icon: <FileText size={14} className="text-zinc-500" />, desc: 'Not yet submitted' };
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Good morning, <span className="text-indigo-600 dark:text-indigo-400">{user?.full_name || 'Candidate'}</span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Here's what's happening with your timesheets.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-zinc-500">
          <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading your dashboard...
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((s, idx) => (
              <Card key={idx} className="relative rounded-2xl group border-zinc-200/60 bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <CardContent className="p-4 !pt-4 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-zinc-500 tracking-tight">{s.title}</p>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 shadow-sm shrink-0">
                      {s.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">{s.value}</h4>
                  </div>
                  <div className={`mt-auto pt-3 flex items-center text-[11px] font-medium ${s.trendClass || 'text-zinc-400 dark:text-zinc-500'}`}>
                    {s.trend}
                    <span className="truncate text-zinc-500">{s.trendText}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="w-full">
            <div>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <Link href="/dashboard/candidate/timesheets" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center">
                    View all <ArrowRight size={14} className="ml-1" />
                  </Link>
                </CardHeader>
                <CardContent className="p-6 max-h-[400px] overflow-y-auto">
                  {recentTimesheets.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                        <Calendar size={24} className="text-zinc-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">No timesheets found.</p>
                      <Link href="/dashboard/candidate/timesheets/new" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
                        Create your first timesheet <ArrowRight size={14} className="ml-1" />
                      </Link>
                    </div>
                  ) : (
                    <Timeline>
                      {recentTimesheets.map((ts, idx) => {
                        const status = getStatusDetails(ts);
                        return (
                          <TimelineItem
                            key={ts.id}
                            isLast={idx === recentTimesheets.length - 1}
                            icon={status.icon}
                            title={`Timesheet ${status.label.toLowerCase()}`}
                            subtitle={
                              <div className="flex flex-col gap-1 mt-1">
                                <span>{format(parseISO(ts.period_start_date), 'MMM dd')} - {format(parseISO(ts.period_end_date), 'MMM dd, yyyy')} &bull; {ts.total_hours} Hours</span>
                                <span className="text-zinc-400 dark:text-zinc-500">{status.desc}</span>
                              </div>
                            }
                            rightContent={
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant={status.badge}>{status.label}</Badge>
                                <span className="text-xs text-zinc-400 flex items-center gap-2">
                                  {formatDistanceToNow(parseISO(ts.updated_at), { addSuffix: true })}
                                  <Link href={`/dashboard/candidate/timesheets/${ts.id}`} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center">
                                    View <ChevronRight size={14} />
                                  </Link>
                                </span>
                              </div>
                            }
                          />
                        );
                      })}
                    </Timeline>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
