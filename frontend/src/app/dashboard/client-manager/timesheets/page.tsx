'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { clientManagerApi, PaginatedTimesheetResponse, PendingQueueParams } from '@/lib/client-manager';
import { Timesheet } from '@/lib/timesheets';
import TimesheetStatusBadge from '@/components/timesheets/TimesheetStatusBadge';
import SkeletonRow from '@/components/timesheets/SkeletonRow';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortField = 'submitted_at' | 'period_start_date' | 'total_hours';
type SortOrder = 'asc' | 'desc';
type FilterTab = 'submitted' | 'client_approved,client_rejected' | '';

interface SortState {
  field: SortField;
  order: SortOrder;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'Pending',  value: 'submitted' },
  { label: 'History',  value: 'client_approved,client_rejected' },
  { label: 'All',      value: '' },
];

const SORT_OPTIONS: { label: string; field: SortField }[] = [
  { label: 'Submitted Date', field: 'submitted_at' },
  { label: 'Period',         field: 'period_start_date' },
  { label: 'Total Hours',    field: 'total_hours' },
];

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPeriod(start: string, end: string) {
  return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d, yyyy')}`;
}

function truncateId(id: string) {
  return id.split('-')[0].toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClientManagerPendingQueue() {
  const [result, setResult]         = useState<PaginatedTimesheetResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab]   = useState<FilterTab>('submitted');
  const [sort, setSort]             = useState<SortState>({ field: 'submitted_at', order: 'asc' });
  const [page, setPage]             = useState(1);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — avoids an API call on every keystroke
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // reset pagination on new search
    }, 350);
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    setSort(prev =>
      prev.field === field
        ? { field, order: prev.order === 'asc' ? 'desc' : 'asc' }
        : { field, order: 'asc' }
    );
    setPage(1);
  };

  const loadTimesheets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: PendingQueueParams = {
        page,
        page_size: PAGE_SIZE,
        sort_by: sort.field,
        sort_order: sort.order,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (activeTab)              params.status_filter = activeTab;

      const data = await clientManagerApi.getPending(params);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheets.');
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedSearch, activeTab]);

  useEffect(() => { loadTimesheets(); }, [loadTimesheets]);

  // ── Sort header helper ────────────────────────────────────────────────────

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <span className="ml-1 text-zinc-300">↕</span>;
    return <span className="ml-1">{sort.order === 'asc' ? '↑' : '↓'}</span>;
  };

  const thClass = (field?: SortField) =>
    `px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider${
      field ? ' cursor-pointer hover:text-zinc-800 select-none transition-colors' : ''
    }`;

  // ── Render ────────────────────────────────────────────────────────────────

  const timesheets = result?.items ?? [];
  const total      = result?.total ?? 0;
  const totalPages = result?.total_pages ?? 1;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Timesheet Queue</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Review and action timesheets submitted by candidates.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
            {loading ? '…' : result?.total ?? 0}
          </span>
          total results
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by candidate name…"
            aria-label="Search timesheets by candidate name"
            className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500 hidden sm:inline">Sort:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.field}
              onClick={() => handleSort(opt.field)}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                sort.field === opt.field
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {opt.label}
              {sort.field === opt.field && (
                <span className="ml-1">{sort.order === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl bg-red-50 p-4 border border-red-200"
        >
          <span className="text-red-500 text-lg">⚠</span>
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={loadTimesheets}
              className="mt-1 text-xs text-red-600 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200" role="table">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className={thClass()}>Candidate</th>
              <th scope="col" className={thClass()}>Employee ID</th>
              <th scope="col" className={thClass()}>Shared With</th>
              <th
                scope="col"
                className={thClass('period_start_date')}
                onClick={() => handleSort('period_start_date')}
                aria-sort={sort.field === 'period_start_date' ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Period <SortIcon field="period_start_date" />
              </th>
              <th
                scope="col"
                className={thClass('total_hours')}
                onClick={() => handleSort('total_hours')}
                aria-sort={sort.field === 'total_hours' ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Hours <SortIcon field="total_hours" />
              </th>
              <th
                scope="col"
                className={thClass('submitted_at')}
                onClick={() => handleSort('submitted_at')}
                aria-sort={sort.field === 'submitted_at' ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Submitted <SortIcon field="submitted_at" />
              </th>
              <th scope="col" className={thClass()}>Status</th>
              <th scope="col" className="relative px-4 py-3">
                <span className="sr-only">Review</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {loading ? (
              <SkeletonRow cols={8} rows={5} />
            ) : timesheets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-5xl" aria-hidden="true">📭</span>
                    <p className="text-base font-semibold text-zinc-700">No timesheets found</p>
                    <p className="text-sm text-zinc-400 max-w-xs">
                      {debouncedSearch
                        ? `No results for "${debouncedSearch}". Try a different name.`
                        : 'Your queue is clear — no timesheets match the current filter.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              timesheets.map(ts => (
                <tr
                  key={ts.id}
                  className="hover:bg-zinc-50 transition-colors group"
                >
                  {/* Candidate name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase">
                        {(ts.candidate_name ?? 'C')[0]}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {ts.candidate_name ?? '—'}
                        </p>
                        {ts.candidate_email && (
                          <p className="text-xs text-zinc-400 truncate max-w-[180px]">
                            {ts.candidate_email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Employee ID */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-zinc-500 bg-zinc-100 rounded px-1.5 py-0.5">
                      {truncateId(ts.candidate_id)}
                    </span>
                  </td>

                  {/* Shared With (Manager Name) */}
                  <td className="px-4 py-3.5 text-sm text-zinc-500">
                    {ts.manager_name ?? <span className="text-zinc-300">—</span>}
                  </td>

                  {/* Period */}
                  <td className="px-4 py-3.5 text-sm text-zinc-700 whitespace-nowrap">
                    {formatPeriod(ts.period_start_date, ts.period_end_date)}
                  </td>

                  {/* Total Hours */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-bold text-indigo-600">{ts.total_hours}h</span>
                  </td>

                  {/* Submitted At */}
                  <td className="px-4 py-3.5 text-sm text-zinc-500 whitespace-nowrap">
                    {ts.submitted_at
                      ? format(parseISO(ts.submitted_at), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <TimesheetStatusBadge status={ts.status} size="sm" />
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/dashboard/client-manager/timesheets/${ts.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Review <span aria-hidden="true">→</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
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
              >
                ←
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={page === p ? 'page' : undefined}
                    className={`min-w-[32px] rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      page === p
                        ? 'bg-indigo-600 text-white'
                        : 'text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
