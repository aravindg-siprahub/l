'use client';

import Link from 'next/link';
import { Timesheet, getTimesheetType, SharePayload } from '@/lib/timesheets';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import ShareManagerModal from '@/components/dashboard/ShareManagerModal';
import { useState } from 'react';

interface Props {
  timesheets: Timesheet[];
  loading: boolean;
  error: string;
  onDownloadPdf: (id: string) => Promise<void>;
  onDownloadExcel: (id: string) => Promise<void>;
  onShareWithManager: (id: string, payload: SharePayload) => Promise<Timesheet>;
  getViewUrl: (ts: Timesheet) => string;
  emptyStateLink: string;
  emptyStateText: string;
  canCreateNew: boolean;
  onTimesheetUpdated: (updated: Timesheet) => void;
}

export default function TimesheetListTable({
  timesheets,
  loading,
  error,
  onDownloadPdf,
  onDownloadExcel,
  onShareWithManager,
  getViewUrl,
  emptyStateLink,
  emptyStateText,
  canCreateNew,
  onTimesheetUpdated,
}: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingExcelId, setDownloadingExcelId] = useState<string | null>(null);
  const [shareTimesheetId, setShareTimesheetId] = useState<string | null>(null);

  const getStatusBadge = (ts: Timesheet) => {
    const statusBadge = (() => {
      switch (ts.status) {
        case 'draft':
          return <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">Draft</span>;
        case 'submitted':
          return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Submitted</span>;
        case 'client_approved':
          return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">Client Approved</span>;
        case 'client_rejected':
          return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Client Rejected</span>;
        case 'finance_approved':
          return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">Finance Approved</span>;
        case 'finance_rejected':
          return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Finance Rejected</span>;
        default:
          return null;
      }
    })();

    const sharedBadge = ts.shared_at
      ? <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-700/10 ml-1">📤 Shared</span>
      : null;

    return <span className="flex flex-wrap items-center gap-1">{statusBadge}{sharedBadge}</span>;
  };

  const handleDownloadClick = async (id: string) => {
    if (downloadingId || downloadingExcelId) return;
    try {
      setDownloadingId(id);
      await onDownloadPdf(id);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadExcelClick = async (id: string) => {
    if (downloadingId || downloadingExcelId) return;
    try {
      setDownloadingExcelId(id);
      await onDownloadExcel(id);
    } finally {
      setDownloadingExcelId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <svg className="animate-spin h-6 w-6 text-indigo-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading timesheets…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Timesheets</h2>
          <p className="mt-1 text-sm text-zinc-500">View, download, and share timesheet submissions.</p>
        </div>
        {canCreateNew && (
          <Link
            href={emptyStateLink}
            className="inline-flex items-center gap-2 justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create Timesheet
          </Link>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
          <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-sm ring-1 ring-zinc-200 sm:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Period</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Hours</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Manager</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Updated At</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-4xl">🗓️</span>
                    <p className="text-sm text-zinc-500">No timesheets yet.</p>
                    {canCreateNew && (
                      <Link href={emptyStateLink} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        {emptyStateText} →
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              timesheets.map((ts) => {
                const isDownloading = downloadingId === ts.id;
                const isDownloadingExcel = downloadingExcelId === ts.id;
                const canDownload   = ts.status !== 'draft';
                const canShare      = ts.status === 'submitted' || ts.status === 'client_rejected' || ts.status === 'finance_rejected';
                const isEditable    = ts.status === 'draft' || ts.status === 'client_rejected' || ts.status === 'finance_rejected';
                const tsType        = getTimesheetType(ts.period_start_date, ts.period_end_date);

                return (
                  <tr key={ts.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                      {format(parseISO(ts.period_start_date), 'MMM d')} – {format(parseISO(ts.period_end_date), 'MMM d, yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        tsType === 'Weekly'
                          ? 'bg-sky-50 text-sky-700 ring-sky-700/10'
                          : 'bg-amber-50 text-amber-700 ring-amber-700/10'
                      }`}>
                        {tsType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-zinc-900">
                      {ts.total_hours}h
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700">
                      {ts.manager_name || ts.manager_email || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(ts)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                      {formatDistanceToNow(parseISO(ts.updated_at), { addSuffix: true })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={getViewUrl(ts)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {isEditable ? 'Edit' : 'View'}
                        </Link>

                        {canDownload && (
                          <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 ml-1">
                            <button
                              type="button"
                              disabled={isDownloading || isDownloadingExcel}
                              onClick={() => handleDownloadClick(ts.id)}
                              title="Download PDF"
                              className="text-rose-500 hover:text-rose-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                            >
                              {isDownloading ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                              )}
                              <span className="sr-only">Download PDF</span>
                            </button>
                            <button
                              type="button"
                              disabled={isDownloading || isDownloadingExcel}
                              onClick={() => handleDownloadExcelClick(ts.id)}
                              title="Download Excel"
                              className="text-emerald-500 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-wait transition-colors ml-1"
                            >
                              {isDownloadingExcel ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                              )}
                              <span className="sr-only">Download Excel</span>
                            </button>
                          </div>
                        )}

                        {canShare && (
                          <div className="border-l border-zinc-200 pl-3">
                            <button
                              type="button"
                              onClick={() => setShareTimesheetId(ts.id)}
                              title={ts.shared_at ? 'Re-share with Manager' : 'Share with Manager'}
                              className={`transition-colors ${
                                ts.shared_at
                                  ? 'text-violet-500 hover:text-violet-700'
                                  : 'text-indigo-500 hover:text-indigo-700'
                              }`}
                            >
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                              </svg>
                              <span className="sr-only">
                                {ts.shared_at ? 'Re-share with Manager' : 'Share with Manager'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {shareTimesheetId && (
        <ShareManagerModal
          onClose={() => setShareTimesheetId(null)}
          onConfirmShare={(payload) => onShareWithManager(shareTimesheetId, payload)}
          onSuccess={(updated) => {
            onTimesheetUpdated(updated);
            setShareTimesheetId(null);
          }}
        />
      )}
    </div>
  );
}
