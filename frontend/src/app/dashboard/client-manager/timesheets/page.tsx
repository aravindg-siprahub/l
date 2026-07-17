'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Timesheet, timesheetsApi } from '@/lib/timesheets';
import { format, parseISO } from 'date-fns';

export default function ClientManagerPendingQueue() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingTimesheets();
  }, []);

  const loadPendingTimesheets = async () => {
    try {
      setLoading(true);
      const data = await timesheetsApi.getClientPending();
      setTimesheets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending timesheets.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading pending timesheets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Pending Approvals</h2>
          <p className="mt-1 text-sm text-zinc-500">Review timesheets submitted by candidates.</p>
        </div>
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Candidate ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Period</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Hours</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Submitted</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                  No pending timesheets in your queue.
                </td>
              </tr>
            ) : (
              timesheets.map((ts) => (
                <tr key={ts.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                    {ts.candidate_id.split('-')[0]}...
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {format(parseISO(ts.period_start_date), 'MMM d')} - {format(parseISO(ts.period_end_date), 'MMM d, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">{ts.total_hours}h</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {ts.submitted_at ? format(parseISO(ts.submitted_at), 'MMM d, yyyy h:mm a') : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/dashboard/client-manager/timesheets/${ts.id}`} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50">
                      Review &rarr;
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
