'use client';

import { useState, useEffect, useMemo } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions, { QuickAction } from '@/components/dashboard/QuickActions';
import { Timesheet, timesheetsApi } from '@/lib/timesheets';
import Link from 'next/link';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

const actions: QuickAction[] = [
  { label: 'Create Timesheet', icon: '➕', href: '/dashboard/candidate/timesheets/new', color: 'indigo', description: 'Log your hours' },
  { label: 'My Timesheets', icon: '🗓️', href: '/dashboard/candidate/timesheets', color: 'zinc', description: 'View history & status' },
  { label: 'My Profile', icon: '👤', href: '/dashboard/candidate/profile', color: 'emerald', description: 'Update details' },
];

export default function CandidateDashboard() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await timesheetsApi.getAll();
        setTimesheets(data);
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
      { title: 'Draft', value: draft.toString(), icon: '📝', color: 'zinc' as const },
      { title: 'Submitted', value: submitted.toString(), icon: '⏳', color: 'blue' as const },
      { title: 'Shared', value: shared.toString(), icon: '📤', color: 'violet' as const },
      { title: 'Approved', value: approved.toString(), icon: '✅', color: 'emerald' as const },
      { title: 'Rejected', value: rejected.toString(), icon: '❌', color: 'red' as const },
    ];
  }, [timesheets]);

  // Rejected timesheets derived from existing state — no additional API call
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Track your timesheet submissions and approvals.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-zinc-500">
          <svg className="animate-spin h-6 w-6 text-indigo-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading your dashboard...
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map(s => <StatsCard key={s.title} {...s} />)}
          </div>

          {/* ── Action Required — rejected timesheets ───────────────────────── */}
          {rejectedTimesheets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚫</span>
                <h3 className="text-base font-semibold text-red-700">
                  Action Required
                  <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {rejectedTimesheets.length}
                  </span>
                </h3>
              </div>

              {rejectedTimesheets.map(ts => (
                <div
                  key={ts.id}
                  className="bg-white rounded-xl border border-red-200 border-l-4 border-l-red-500 shadow-sm p-5"
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {format(parseISO(ts.period_start_date), 'dd MMM yyyy')} —{' '}
                        {format(parseISO(ts.period_end_date), 'dd MMM yyyy')}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {ts.total_hours}h &bull; Rejected{' '}
                        {formatDistanceToNow(parseISO(ts.updated_at), { addSuffix: true })}
                        {ts.manager_name ? ` by ${ts.manager_name}` : ''}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                      {ts.status === 'finance_rejected' ? 'Finance Rejected' : 'Client Rejected'}
                    </span>
                  </div>

                  {/* Rejection reason */}
                  {ts.rejection_reason && (
                    <div className="rounded-md bg-red-50 border border-red-100 px-4 py-3 mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">
                        Reason for Rejection
                      </p>
                      <p className="text-sm text-red-900">{ts.rejection_reason}</p>
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/candidate/timesheets/${ts.id}`}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                    >
                      Edit Timesheet →
                    </Link>
                    <Link
                      href={`/dashboard/candidate/timesheets/${ts.id}`}
                      className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50 transition-colors"
                    >
                      Resubmit →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Main content grid ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900">Recent Activity</h3>
              <div className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-200 overflow-hidden">
                {recentTimesheets.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="text-4xl block mb-3">🗓️</span>
                    <p className="text-sm text-zinc-500">No timesheets found.</p>
                    <Link href="/dashboard/candidate/timesheets/new" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 inline-block">
                      Create your first timesheet →
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {recentTimesheets.map(ts => (
                      <li key={ts.id} className="p-4 hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              Timesheet for {ts.period_start_date} to {ts.period_end_date}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {ts.total_hours} hours • Last updated {formatDistanceToNow(parseISO(ts.updated_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/candidate/timesheets/${ts.id}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            View →
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {recentTimesheets.length > 0 && (
                  <div className="bg-zinc-50 p-3 text-center border-t border-zinc-100">
                    <Link href="/dashboard/candidate/timesheets" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                      View all timesheets
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div>
              <QuickActions actions={actions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
