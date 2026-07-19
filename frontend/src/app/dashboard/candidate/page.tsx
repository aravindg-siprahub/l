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
  FileEdit, 
  Send, 
  Users, 
  CheckCircle2, 
  XCircle,
  Calendar,
  PlusCircle,
  UserCircle,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Minus,
  FileText
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
      { title: 'Draft', value: draft.toString(), icon: <FileEdit size={20} className="text-indigo-600" />, bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: <Minus size={14} className="mr-1 text-zinc-400" />, trendText: 'vs last 30 days' },
      { title: 'Submitted', value: submitted.toString(), icon: <Send size={20} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20', trend: <Minus size={14} className="mr-1 text-zinc-400" />, trendText: 'vs last 30 days' },
      { title: 'Shared', value: shared.toString(), icon: <Users size={20} className="text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-900/20', trend: <TrendingUp size={14} className="mr-1 text-emerald-500" />, trendText: '100% vs last 30 days', trendClass: 'text-emerald-600 dark:text-emerald-400' },
      { title: 'Approved', value: approved.toString(), icon: <CheckCircle2 size={20} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: <TrendingUp size={14} className="mr-1 text-emerald-500" />, trendText: '100% vs last 30 days', trendClass: 'text-emerald-600 dark:text-emerald-400' },
      { title: 'Rejected', value: rejected.toString(), icon: <XCircle size={20} className="text-red-500" />, bg: 'bg-red-50 dark:bg-red-900/20', trend: <Minus size={14} className="mr-1 text-zinc-400" />, trendText: 'vs last 30 days' },
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
      .slice(0, 5);
  }, [timesheets]);

  const upcomingTimesheets = useMemo(() => {
    return [...timesheets]
      .filter(t => t.status === 'submitted' || t.status === 'client_approved' || t.shared_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 2);
  }, [timesheets]);

  const getStatusDetails = (ts: Timesheet) => {
    if (ts.status === 'client_rejected' || ts.status === 'finance_rejected') {
      return { label: 'Rejected', badge: 'danger' as const, icon: <XCircle size={14} className="text-red-600" />, desc: 'Rejected in review' };
    }
    if (ts.status === 'client_approved' || ts.status === 'finance_approved') {
      return { label: 'Approved', badge: 'success' as const, icon: <CheckCircle2 size={14} className="text-emerald-600" />, desc: 'Approved in workflow' };
    }
    if (ts.shared_at) {
      return { label: 'Shared', badge: 'warning' as const, icon: <Users size={14} className="text-amber-600" />, desc: 'Shared with Client Manager' };
    }
    if (ts.status === 'submitted') {
      return { label: 'Submitted', badge: 'info' as const, icon: <Send size={14} className="text-blue-600" />, desc: 'Submitted for approval' };
    }
    return { label: 'Draft', badge: 'default' as const, icon: <FileEdit size={14} className="text-zinc-600" />, desc: 'Draft saved' };
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
              <Card key={idx} className="relative overflow-hidden group hover:border-zinc-300 transition-colors">
                {/* Subtle top accent line */}
                <div className={`absolute top-0 left-0 w-full h-[3px] ${s.bg.split(' ')[0].replace('bg-', 'bg-').replace('50', '500')}`} />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{s.title}</p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${s.bg}`}>
                      {s.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{s.value}</h4>
                  </div>
                  <div className={`mt-3 flex items-center text-xs font-medium ${s.trendClass || 'text-zinc-500 dark:text-zinc-400'}`}>
                    {s.trend}
                    <span className="ml-1.5 truncate text-zinc-500">{s.trendText}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <Link href="/dashboard/candidate/timesheets" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center">
                    View all <ArrowRight size={14} className="ml-1" />
                  </Link>
                </CardHeader>
                <CardContent className="p-6">
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
            
            <div className="space-y-6">
              {/* Upcoming Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">Upcoming Status</h3>
                  <Link href="/dashboard/candidate/timesheets" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    View all
                  </Link>
                </div>
                {upcomingTimesheets.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingTimesheets.map(ts => {
                      const status = getStatusDetails(ts);
                      return (
                        <Card key={ts.id} className="bg-white dark:bg-zinc-950 hover:border-zinc-300 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mt-0.5">
                                  <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                    {format(parseISO(ts.period_start_date), 'MMM dd')} - {format(parseISO(ts.period_end_date), 'MMM dd, yyyy')}
                                  </p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                    {ts.total_hours} Hours &bull; Submitted {formatDistanceToNow(parseISO(ts.updated_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <Badge variant={status.badge === 'success' ? 'warning' : status.badge} className="whitespace-nowrap">
                                {ts.status === 'client_approved' ? 'Under HR Review' : 'Awaiting Client Approval'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="bg-white dark:bg-zinc-950">
                    <CardContent className="p-6 text-center text-sm text-zinc-500">
                      No upcoming status to track.
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">Quick Actions</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/dashboard/candidate/timesheets/new" className="block group h-full">
                    <Card className="h-full hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md">
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                          <PlusCircle size={18} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 mt-1">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            Submit Time
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">Log hours</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/dashboard/candidate/timesheets" className="block group h-full">
                    <Card className="h-full hover:border-blue-300 dark:hover:border-blue-800 transition-colors bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md">
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                          <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 mt-1">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            Timesheets
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">View history</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/dashboard/candidate/profile" className="block group h-full">
                    <Card className="h-full hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md">
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                          <UserCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 mt-1">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            My Profile
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">Update details</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/dashboard/candidate/reports" className="block group h-full">
                    <Card className="h-full hover:border-orange-300 dark:hover:border-orange-800 transition-colors bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md">
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                          <FileText size={18} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="min-w-0 mt-1">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                            Reports
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">View analytics</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
