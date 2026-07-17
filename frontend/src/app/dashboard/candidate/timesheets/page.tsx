'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Timesheet, timesheetsApi } from '@/lib/timesheets';
import { format, parseISO } from 'date-fns';

export default function CandidateTimesheetsList() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTimesheets();
  }, []);

  const loadTimesheets = async () => {
    try {
      setLoading(true);
      const data = await timesheetsApi.getAll();
      setTimesheets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheets.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Timesheet['status']) => {
    switch (status) {
      case 'draft': return <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">Draft</span>;
      case 'submitted': return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Submitted</span>;
      case 'client_approved': return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">Client Approved</span>;
      case 'client_rejected': return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Client Rejected</span>;
      case 'finance_approved': return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">Finance Approved</span>;
      case 'finance_rejected': return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Finance Rejected</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading timesheets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">My Timesheets</h2>
          <p className="mt-1 text-sm text-zinc-500">View and manage your timesheet submissions.</p>
        </div>
        <Link href="/dashboard/candidate/timesheets/new" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Create Timesheet
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm ring-1 ring-zinc-200 sm:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Period</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Hours</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Submitted</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                  No timesheets found. Click "Create Timesheet" to start.
                </td>
              </tr>
            ) : (
              timesheets.map((ts) => (
                <tr key={ts.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                    {format(parseISO(ts.period_start_date), 'MMM d')} - {format(parseISO(ts.period_end_date), 'MMM d, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">{ts.total_hours}h</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">{getStatusBadge(ts.status)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {ts.submitted_at ? format(parseISO(ts.submitted_at), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/dashboard/candidate/timesheets/${ts.id}`} className="text-indigo-600 hover:text-indigo-900">
                      {ts.status === 'draft' || ts.status === 'client_rejected' || ts.status === 'finance_rejected' ? 'Edit' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
