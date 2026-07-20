'use client';

import Link from 'next/link';
import { Timesheet, getTimesheetType, SharePayload } from '@/lib/timesheets';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Plus, Eye, Edit2, FileText, Sheet, Send, CheckCircle2, XCircle, FileEdit, Users, MoreHorizontal, Download } from 'lucide-react';
import ShareManagerModal from '@/components/dashboard/ShareManagerModal';
import { Card, CardContent } from '@/components/ui/Card';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"><FileEdit size={12} /> Draft</span>;
        case 'submitted':
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"><Send size={12} /> Submitted</span>;
        case 'client_approved':
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={12} /> Client Approved</span>;
        case 'client_rejected':
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"><XCircle size={12} /> Client Rejected</span>;
        case 'finance_approved':
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={12} /> Finance Approved</span>;
        case 'finance_rejected':
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"><XCircle size={12} /> Finance Rejected</span>;
        default:
          return null;
      }
    })();

    const sharedBadge = ts.shared_at
      ? <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700"><Users size={12} /> Shared</span>
      : null;

    return <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">{statusBadge}{sharedBadge}</div>;
  };

  const router = useRouter();

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
            className="inline-flex items-center gap-2 justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            <Plus size={16} />
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
      <Card className="overflow-hidden border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Period</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Hours</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Manager</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Updated At</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 bg-white dark:bg-zinc-950">
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
                const tsType        = getTimesheetType(ts.period_start_date, ts.period_end_date);

                return (
                  <TimesheetRow
                    key={ts.id}
                    ts={ts}
                    tsType={tsType}
                    canDownload={canDownload}
                    canShare={canShare}
                    isDownloading={isDownloading}
                    isDownloadingExcel={isDownloadingExcel}
                    onDownloadClick={() => handleDownloadClick(ts.id)}
                    onDownloadExcelClick={() => handleDownloadExcelClick(ts.id)}
                    onShareClick={() => setShareTimesheetId(ts.id)}
                    statusBadge={getStatusBadge(ts)}
                    viewUrl={getViewUrl(ts)}
                    router={router}
                  />
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </Card>

      {shareTimesheetId && (
        <ShareManagerModal
          timesheet={timesheets.find(t => t.id === shareTimesheetId)}
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

function TimesheetRow({
  ts,
  tsType,
  canDownload,
  canShare,
  isDownloading,
  isDownloadingExcel,
  onDownloadClick,
  onDownloadExcelClick,
  onShareClick,
  statusBadge,
  viewUrl,
  router
}: any) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <tr 
      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
      onClick={() => router.push(viewUrl)}
    >
      <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {format(parseISO(ts.period_start_date), 'MMM d')} – {format(parseISO(ts.period_end_date), 'MMM d, yyyy')}
      </td>
      <td className="whitespace-nowrap px-6 py-5 text-sm text-zinc-500">
        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
          tsType === 'Weekly'
            ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
        }`}>
          {tsType}
        </span>
      </td>
      <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {ts.total_hours}h
      </td>
      <td className="whitespace-nowrap px-6 py-5 text-sm text-zinc-600 dark:text-zinc-400">
        {ts.manager_name || ts.manager_email || '—'}
      </td>
      <td className="px-6 py-5 text-sm">
        {statusBadge}
      </td>
      <td className="whitespace-nowrap px-6 py-5 text-sm text-zinc-500 dark:text-zinc-500">
        {formatDistanceToNow(parseISO(ts.updated_at), { addSuffix: true })}
      </td>
      <td className="whitespace-nowrap px-6 py-5 text-right text-sm font-medium">
        <div 
          className="flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {canShare && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onShareClick(); }}
              title={ts.shared_at ? 'Re-share with Manager' : 'Share with Manager'}
              className="p-2 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          )}

          {canDownload && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-zinc-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDownloadClick(); setDropdownOpen(false); }}
                    disabled={isDownloading || isDownloadingExcel}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : <FileText size={16} className="text-rose-500" />}
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDownloadExcelClick(); setDropdownOpen(false); }}
                    disabled={isDownloading || isDownloadingExcel}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isDownloadingExcel ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : <Sheet size={16} className="text-emerald-500" />}
                    Download Excel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
