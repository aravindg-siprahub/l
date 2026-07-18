'use client';

/**
 * Approval History Page
 * Shows timesheets this client manager has already reviewed (approved or rejected).
 * Reuses the same clientManagerApi.getPending() endpoint with status_filter,
 * so no new backend endpoint is needed.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { clientManagerApi, PaginatedTimesheetResponse, PendingQueueParams } from '@/lib/client-manager';
import TimesheetStatusBadge from '@/components/timesheets/TimesheetStatusBadge';
import SkeletonRow from '@/components/timesheets/SkeletonRow';

const PAGE_SIZE = 20;
type SortField = 'submitted_at' | 'period_start_date' | 'total_hours';
type SortOrder = 'asc' | 'desc';

function formatPeriod(start: string, end: string) {
  return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d, yyyy')}`;
}

export default function ApprovalHistoryPage() {
  const [result, setResult]   = useState<PaginatedTimesheetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter]   = useState<'client_approved' | 'client_rejected' | 'client_approved,client_rejected'>('client_approved,client_rejected');
  const [sort, setSort]                   = useState<{ field: SortField; order: SortOrder }>({ field: 'submitted_at', order: 'desc' });
  const [page, setPage]                   = useState(1);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setDebouncedSearch(value); setPage(1); }, 350);
  };

  const handleSort = (field: SortField) => {
    setSort(prev =>
      prev.field === field
        ? { field, order: prev.order === 'asc' ? 'desc' : 'asc' }
        : { field, order: 'desc' }
    );
    setPage(1);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: PendingQueueParams = {
        page,
        page_size: PAGE_SIZE,
        sort_by: sort.field,
        sort_order: sort.order,
        status_filter: statusFilter,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      setResult(await clientManagerApi.getPending(params));
    } catch (err: any) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const timesheets  = result?.items       ?? [];
  const total       = result?.total       ?? 0;
  const totalPages  = result?.total_pages ?? 1;

  const SortIcon = ({ field }: { field: SortField }) =>
    sort.field !== field
      ? <span className="ml-1 text-zinc-300">↕</span>
      : <span className="ml-1">{sort.order === 'asc' ? '↑' : '↓'}</span>;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/client-manager/timesheets"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            ← Back to queue
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-zinc-900">Approval History</h2>
          <p className="mt-1 text-sm text-zinc-500">Timesheets you have approved or rejected.</p>
        </div>
        <div className="text-sm text-zinc-500">
          <span className="font-bold text-zinc-900">{loading ? '…' : total}</span> records
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {[
          { label: 'All Reviewed',  value: 'client_approved,client_rejected' },
          { label: 'Approved Only', value: 'client_approved' },
          { label: 'Rejected Only', value: 'client_rejected' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value as typeof statusFilter); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              statusFilter === tab.value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">🔍</span>
        <input
          type="search"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by candidate name…"
          aria-label="Search history by candidate name"
          className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 p-4 border border-red-200">
          <span className="text-red-500">⚠</span>
          <div>
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={load} className="mt-1 text-xs text-red-600 underline">Retry</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200" role="table">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Candidate</th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-800 select-none"
                onClick={() => handleSort('period_start_date')}
                aria-sort={sort.field === 'period_start_date' ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Period <SortIcon field="period_start_date" />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-800 select-none"
                onClick={() => handleSort('total_hours')}
                aria-sort={sort.field === 'total_hours' ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Hours <SortIcon field="total_hours" />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-800 select-none"
                onClick={() => handleSort('submitted_at')}
                aria-sort={sort.field === 'submitted_at' ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Reviewed <SortIcon field="submitted_at" />
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Outcome</th>
              <th scope="col" className="relative px-4 py-3"><span className="sr-only">View</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {loading ? (
              <SkeletonRow cols={6} rows={5} />
            ) : timesheets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-5xl" aria-hidden="true">📋</span>
                    <p className="text-base font-semibold text-zinc-700">No history found</p>
                    <p className="text-sm text-zinc-400">
                      {debouncedSearch ? `No results for "${debouncedSearch}".` : 'No reviewed timesheets match this filter.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              timesheets.map(ts => (
                <tr key={ts.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase">
                        {(ts.candidate_name ?? 'C')[0]}
                      </span>
                      <p className="text-sm font-semibold text-zinc-900">
                        {ts.candidate_name ?? '—'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-700 whitespace-nowrap">
                    {formatPeriod(ts.period_start_date, ts.period_end_date)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-bold text-indigo-600">{ts.total_hours}h</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-500 whitespace-nowrap">
                    {ts.reviewed_at ? format(parseISO(ts.reviewed_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <TimesheetStatusBadge status={ts.status} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/dashboard/client-manager/timesheets/${ts.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-xs text-zinc-500">
              Showing{' '}
              <span className="font-medium text-zinc-700">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
              </span>{' '}
              of <span className="font-medium text-zinc-700">{total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >←</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  aria-label={`Page ${i + 1}`}
                  aria-current={page === i + 1 ? 'page' : undefined}
                  className={`min-w-[32px] rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    page === i + 1 ? 'bg-indigo-600 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
