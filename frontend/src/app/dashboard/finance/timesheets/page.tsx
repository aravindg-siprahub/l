'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Timesheet } from '@/lib/timesheets';
import { financeApi } from '@/lib/finance';
import { format, parseISO } from 'date-fns';

export default function FinancePendingQueue() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    financeApi.getPending()
      .then(setTimesheets)
      .catch((e: any) => setError(e.message || 'Failed to load queue.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading validation queue...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Finance Validation Queue</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Timesheets approved by the Client Manager, awaiting your final review.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm ring-1 ring-zinc-200 sm:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Candidate</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Period</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Hours</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Submitted</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Client Notes</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-500">
                  No timesheets pending your review.
                </td>
              </tr>
            ) : (
              timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                    {ts.candidate_id.slice(0, 8)}...
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {format(parseISO(ts.period_start_date), 'MMM d')} – {format(parseISO(ts.period_end_date), 'MMM d, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-zinc-900">
                    {ts.total_hours}h
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {ts.submitted_at ? format(parseISO(ts.submitted_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">
                    {ts.approval_comments || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/finance/timesheets/${ts.id}`}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Review →
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
