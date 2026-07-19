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
              <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Candidate & Client</th>
              <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Period</th>
              <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Hours</th>
              <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Submitted</th>
              <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Client Notes</th>
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
                <tr key={ts.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 shadow-sm">
                        {ts.candidate_name ? ts.candidate_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-zinc-900">{ts.candidate_name || 'Unknown Candidate'}</span>
                        <span className="text-[12px] font-medium text-zinc-500">
                          Client: <span className="text-zinc-700">{ts.manager_name || ts.manager_email?.split('@')[0] || 'Unknown'}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-[13px] font-medium text-zinc-900">{format(parseISO(ts.period_start_date), 'MMM d')} – {format(parseISO(ts.period_end_date), 'MMM d, yyyy')}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-zinc-100 text-[13px] font-bold text-zinc-700 border border-zinc-200">
                      {ts.total_hours}h
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-[13px] text-zinc-500 font-medium">
                      {ts.submitted_at ? format(parseISO(ts.submitted_at), 'MMM d, yyyy') : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-zinc-500 max-w-[200px] truncate font-medium">
                    {ts.approval_comments || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/finance/timesheets/${ts.id}`}
                      className="inline-flex items-center rounded bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm hover:bg-indigo-500 transition-colors"
                    >
                      Review & Generate Invoice &rarr;
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
