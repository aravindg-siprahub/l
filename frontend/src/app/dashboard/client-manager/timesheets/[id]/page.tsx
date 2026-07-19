'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO, getISOWeek } from 'date-fns';
import {
  ArrowLeft, Calendar, User, Mail, Hash, Clock, Share2,
  CheckCircle2, XCircle, Send, Shield, ChevronRight,
  AlertCircle, FileText, Hourglass,
} from 'lucide-react';
import { clientManagerApi, AuditLogEntry } from '@/lib/client-manager';
import { Timesheet } from '@/lib/timesheets';
import TimesheetStatusBadge from '@/components/timesheets/TimesheetStatusBadge';
import { SkeletonCard } from '@/components/timesheets/SkeletonRow';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPeriod(start: string, end: string) {
  return `${format(parseISO(start), 'MMM d, yyyy')} – ${format(parseISO(end), 'MMM d, yyyy')}`;
}

function getWeekLabel(start: string) {
  try { return `Week ${getISOWeek(parseISO(start))}`; } catch { return ''; }
}

// ── Audit Timeline (always visible, redesigned) ───────────────────────────────

const auditConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  submitted:      { icon: <Send size={13} strokeWidth={2.5} />,        color: 'bg-blue-50 text-blue-600',    label: 'Submitted' },
  resubmitted:    { icon: <Send size={13} strokeWidth={2.5} />,        color: 'bg-blue-50 text-blue-600',    label: 'Resubmitted' },
  shared:         { icon: <Share2 size={13} strokeWidth={2.5} />,      color: 'bg-indigo-50 text-indigo-600',label: 'Shared with Manager' },
  client_approved:{ icon: <CheckCircle2 size={13} strokeWidth={2.5} />,color: 'bg-emerald-50 text-emerald-600',label: 'Approved' },
  client_rejected:{ icon: <XCircle size={13} strokeWidth={2.5} />,     color: 'bg-red-50 text-red-600',      label: 'Rejected' },
  finance_approved:{ icon:<CheckCircle2 size={13} strokeWidth={2.5} />,color: 'bg-emerald-50 text-emerald-600',label: 'Finance Approved' },
  finance_rejected:{ icon:<XCircle size={13} strokeWidth={2.5} />,     color: 'bg-red-50 text-red-600',      label: 'Finance Rejected' },
};

function AuditEntry({ log }: { log: AuditLogEntry; isCurrent: boolean }) {
  const cfg = auditConfig[log.action] ?? { icon: <Clock size={13} />, color: 'bg-zinc-50 text-zinc-500', label: log.action };
  return (
    <li className="relative flex gap-3.5">
      {/* Icon Node */}
      <div className="relative shrink-0 flex items-start pt-0.5">
        <div className={`relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full ring-4 ring-white ${cfg.color}`}>
          {cfg.icon}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-bold text-zinc-900 leading-tight">{cfg.label}</p>
          {log.version && (
            <span className="shrink-0 text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">v{log.version}</span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
          By <span className="font-semibold">{log.actor_name ?? 'System'}</span>
          {log.created_at ? (
            <> &bull; {format(parseISO(log.created_at), 'MMM d')} at {format(parseISO(log.created_at), 'HH:mm')}</>
          ) : null}
        </p>
        {log.comments && (
          <p className="text-[11px] text-zinc-600 mt-1.5 italic bg-zinc-50 rounded-lg px-2.5 py-1.5 border border-zinc-200 leading-relaxed">
            "{log.comments}"
          </p>
        )}
      </div>
    </li>
  );
}

function PendingReviewNode() {
  return (
    <li className="relative flex gap-3.5">
      <div className="relative shrink-0 flex items-start pt-0.5">
        <div className="relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-zinc-50 text-zinc-400 ring-4 ring-white">
          <Hourglass size={13} strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold text-zinc-900 leading-tight">Pending Review</p>
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
            Current
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">Current status &bull; Waiting for your action</p>
      </div>
    </li>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps { title: string; description: string; children: React.ReactNode; onClose: () => void; }

function Modal({ title, description, children, onClose }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="relative z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">
      <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="p-6 border-b border-zinc-100">
              <h3 id="modal-title" className="text-lg font-bold text-zinc-900">{title}</h3>
              <p id="modal-description" className="mt-1 text-sm text-zinc-500">{description}</p>
            </div>
            <div className="p-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClientManagerTimesheetReview() {
  const router = useRouter();
  const params = useParams();
  const timesheetId = params.id as string;

  const [timesheet, setTimesheet]   = useState<Timesheet | null>(null);
  const [auditLog, setAuditLog]     = useState<AuditLogEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState('');

  const [showRejectModal, setShowRejectModal]   = useState(false);
  const [rejectionReason, setRejectionReason]   = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');

  // ── Loaders ─────────────────────────────────────────────────────────────

  const loadTimesheet = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const data = await clientManagerApi.getReview(timesheetId);
      setTimesheet(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheet.');
    } finally {
      setLoading(false);
    }
  }, [timesheetId]);

  const loadAuditLog = useCallback(async () => {
    if (!timesheetId) return;
    try {
      setAuditLoading(true);
      const logs = await clientManagerApi.getAuditLog(timesheetId);
      setAuditLog(logs);
    } catch { /* non-critical */ } finally {
      setAuditLoading(false);
    }
  }, [timesheetId]);

  useEffect(() => { loadTimesheet(); loadAuditLog(); }, [loadTimesheet, loadAuditLog]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (processing) return;
    try {
      setProcessing(true); setError('');
      await clientManagerApi.approve(timesheetId, approvalComments || undefined);
      router.push('/dashboard/client-manager/timesheets');
    } catch (err: any) {
      setError(err.message || 'Failed to approve timesheet.');
      setShowApproveModal(false);
    } finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || processing) return;
    try {
      setProcessing(true); setError('');
      await clientManagerApi.reject(timesheetId, rejectionReason);
      router.push('/dashboard/client-manager/timesheets');
    } catch (err: any) {
      setError(err.message || 'Failed to reject timesheet.');
      setShowRejectModal(false);
    } finally { setProcessing(false); }
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const currentVersion = timesheet?.current_version ?? 1;
  const currentEntries = (timesheet?.entries ?? []).filter(e => (e.version ?? 1) === currentVersion);

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 pb-12 px-4">
        <div className="h-7 w-44 rounded-lg bg-zinc-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={5} />
            <SkeletonCard lines={6} />
          </div>
          <SkeletonCard lines={8} />
        </div>
      </div>
    );
  }

  // ── Error / not-found ────────────────────────────────────────────────────

  if (!timesheet) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Timesheet not accessible</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            {error || 'This timesheet could not be loaded. It may not exist or you may not be assigned to review it.'}
          </p>
          <Link href="/dashboard/client-manager/timesheets" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">
            <ArrowLeft size={14} /> Back to queue
          </Link>
        </div>
      </div>
    );
  }

  const canAct = timesheet.status === 'submitted';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10 px-4">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/client-manager/timesheets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to queue
          </Link>
          <h2 className="text-2xl font-bold text-zinc-900">Review Timesheet</h2>
          <p className="mt-1 text-sm text-zinc-500 flex items-center gap-2">
            Reviewing submission from{' '}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[9px] font-bold">
                {(timesheet.candidate_name ?? 'C')[0].toUpperCase()}
              </span>
              {timesheet.candidate_name ?? 'Candidate'}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2.5">
            <TimesheetStatusBadge status={timesheet.status} />
            {canAct && (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => { setShowRejectModal(true); setError(''); }}
                  className="flex items-center gap-1.5 rounded-lg bg-white border border-red-200 px-3 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                >
                  <XCircle size={14} strokeWidth={2.5} />
                  Reject
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => { setShowApproveModal(true); setError(''); }}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-[12px] font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                  Approve
                </button>
              </div>
            )}
          </div>
          {timesheet.period_start_date && (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
              <Calendar size={14} className="text-zinc-400" />
              <span className="text-[12px] font-semibold text-zinc-700">
                {format(parseISO(timesheet.period_start_date), 'MMM d')} – {format(parseISO(timesheet.period_end_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Inline error ── */}
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 p-4 border border-red-200">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ─────────────── LEFT COLUMN: Daily Entries + Comment ─────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── Daily Entries ── */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                  <Clock size={16} className="text-purple-600" />
                </div>
                <h3 className="text-[14px] font-bold text-zinc-900">Daily Entries</h3>
              </div>
              <span className="text-[12px] font-semibold text-zinc-400">
                {currentEntries.length} {currentEntries.length === 1 ? 'entry' : 'entries'} · v{currentVersion}
              </span>
            </div>

            {currentEntries.length === 0 ? (
              <p className="px-5 py-8 text-sm text-zinc-400 text-center">No entries recorded.</p>
            ) : (
              <table className="min-w-full divide-y divide-zinc-50" role="table" aria-label="Timesheet daily entries">
                <thead>
                  <tr className="bg-zinc-50/80">
                    <th scope="col" className="px-5 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-5 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-24">Hours</th>
                    <th scope="col" className="px-5 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Task Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {currentEntries.map((entry, idx) => (
                    <tr key={entry.id ?? idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-5 py-3.5 text-[13px] font-bold text-zinc-700 whitespace-nowrap">
                        {format(parseISO(entry.date), 'EEE, MMM d')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[15px] font-extrabold text-indigo-600">{entry.hours_worked}h</span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-zinc-600">{entry.task_description}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-indigo-50/40 border-t-2 border-indigo-100">
                  <tr>
                    <td className="px-5 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total</td>
                    <td className="px-5 py-3"><span className="text-[15px] font-extrabold text-indigo-700">{timesheet.total_hours}h</span></td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* ── Add a Comment ── */}
          {canAct && (
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-100">
                <Mail size={14} className="text-indigo-500" />
                <h3 className="text-[13px] font-bold text-zinc-900">
                  Add a comment{' '}
                  <span className="text-zinc-400 font-normal text-[11px]">(optional)</span>
                </h3>
              </div>
              <div className="px-5 py-4">
                <textarea
                  rows={4}
                  value={approvalComments}
                  onChange={e => setApprovalComments(e.target.value)}
                  placeholder="Write your comments here…"
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 px-4 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
                />
                <p className="mt-2 text-[11px] text-zinc-400">Your feedback will be visible to the candidate.</p>
              </div>
            </div>
          )}
        </div>

        {/* ─────────────── RIGHT COLUMN: Submission + Summary + Audit ─────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Submission Overview ── */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <FileText size={16} className="text-indigo-600" />
              </div>
              <h3 className="text-[14px] font-bold text-zinc-900">Submission Overview</h3>
            </div>
            <dl className="divide-y divide-zinc-50">
              {[
                { label: 'Candidate', icon: <User size={13} className="text-zinc-400" />, value: (
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      {(timesheet.candidate_name ?? 'C')[0].toUpperCase()}
                    </span>
                    <span className="font-bold text-indigo-600">{timesheet.candidate_name ?? '—'}</span>
                  </span>
                )},
                { label: 'Email', icon: <Mail size={13} className="text-zinc-400" />, value: timesheet.candidate_email ?? '—' },
                { label: 'Employee ID', icon: <Hash size={13} className="text-zinc-400" />, value: (
                  <span className="font-mono text-xs bg-zinc-100 rounded px-1.5 py-0.5 text-zinc-600">
                    {timesheet.candidate_id.split('-')[0].toUpperCase()}
                  </span>
                )},
              ].map(({ label, icon, value }) => (
                <div key={label} className="flex items-center px-5 py-3 gap-0">
                  <dt className="flex items-center gap-1.5 w-28 shrink-0 text-[12px] font-medium text-zinc-500">
                    {icon} {label}
                  </dt>
                  <dd className="flex-1 text-[13px] font-medium text-zinc-900 min-w-0">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Timesheet Summary ── */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <h3 className="text-[14px] font-bold text-zinc-900">Timesheet Summary</h3>
            </div>
            <dl className="divide-y divide-zinc-50">
              {[
                { label: 'Period', value: (
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-zinc-900 text-[13px]">{formatPeriod(timesheet.period_start_date, timesheet.period_end_date)}</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                      {getWeekLabel(timesheet.period_start_date)}
                    </span>
                  </span>
                )},
                { label: 'Total Hours', value: <span className="text-xl font-extrabold text-indigo-600">{timesheet.total_hours}h</span> },
                { label: 'Shared With', value: (
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                      {(timesheet.manager_name ?? 'M')[0].toUpperCase()}
                    </span>
                    <span className="text-[13px]">{timesheet.manager_name ?? '—'}</span>
                  </span>
                )},
                { label: 'Submitted On', value: timesheet.submitted_at ? format(parseISO(timesheet.submitted_at), "MMM d, yyyy 'at' HH:mm") : '—' },
                { label: 'Version', value: `v${currentVersion}` },
                ...(timesheet.rejection_reason ? [{ label: 'Rejection Reason', value: (
                  <span className="text-red-700 bg-red-50 rounded px-2 py-0.5 text-xs ring-1 ring-red-200">{timesheet.rejection_reason}</span>
                )}] : []),
                ...(timesheet.approval_comments ? [{ label: 'Approval Notes', value: timesheet.approval_comments }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center px-5 py-3 gap-0">
                  <dt className="w-28 shrink-0 text-[12px] font-medium text-zinc-500">{label}</dt>
                  <dd className="flex-1 text-[13px] font-medium text-zinc-900 min-w-0">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Audit History ── */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                <Shield size={16} className="text-slate-600" />
              </div>
              <h3 className="text-[14px] font-bold text-zinc-900">Audit History</h3>
            </div>
            <div className="px-5 py-5">
              {auditLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-zinc-100" />)}
                </div>
              ) : (
                <ul className="relative space-y-0 before:absolute before:inset-y-0 before:left-[12px] before:w-[2px] before:bg-zinc-100">
                  {auditLog.map((log, i) => (
                    <AuditEntry key={log.id ?? i} log={log} isCurrent={false} />
                  ))}
                  {timesheet.status === 'submitted' && <PendingReviewNode />}
                  {auditLog.length === 0 && !auditLoading && (
                    <p className="text-sm text-zinc-400 py-4">No audit events yet.</p>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Approve Modal ── */}
      {showApproveModal && (
        <Modal
          title="Approve Timesheet"
          description="Confirm approval. This timesheet will be forwarded to the Finance team for processing."
          onClose={() => !processing && setShowApproveModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="approval-comments" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Approval Comments <span className="text-xs font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="approval-comments"
                rows={3}
                value={approvalComments}
                onChange={e => setApprovalComments(e.target.value)}
                placeholder="Add any notes for the Finance team…"
                className="block w-full rounded-lg border border-zinc-300 py-2 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" disabled={processing} onClick={() => setShowApproveModal(false)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-50 disabled:opacity-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" disabled={processing} onClick={handleApprove}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer">
                <CheckCircle2 size={15} />
                {processing ? 'Approving…' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <Modal
          title="Reject Timesheet"
          description="Please provide a clear reason. The candidate will see this feedback and can correct and resubmit."
          onClose={() => !processing && setShowRejectModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Rejection Reason <span className="text-red-500 text-xs" aria-label="required">*</span>
              </label>
              <textarea
                id="rejection-reason" rows={4}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="E.g., Missing hours on Thursday. Please verify task descriptions and resubmit."
                aria-required="true" aria-describedby="rejection-reason-hint"
                className={`block w-full rounded-lg border py-2 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  rejectionReason.trim() ? 'border-zinc-300 focus:ring-indigo-500' : 'border-red-300 focus:ring-red-500'
                }`}
              />
              <p id="rejection-reason-hint" className="mt-1 text-xs text-zinc-400">Required — the candidate will see this message.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" disabled={processing} onClick={() => setShowRejectModal(false)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-50 disabled:opacity-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" disabled={!rejectionReason.trim() || processing} onClick={handleReject}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer">
                <XCircle size={15} />
                {processing ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
