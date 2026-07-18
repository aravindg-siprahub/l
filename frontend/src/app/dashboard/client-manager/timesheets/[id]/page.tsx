'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { clientManagerApi, AuditLogEntry } from '@/lib/client-manager';
import { Timesheet } from '@/lib/timesheets';
import TimesheetStatusBadge from '@/components/timesheets/TimesheetStatusBadge';
import AuditTimeline from '@/components/timesheets/AuditTimeline';
import { SkeletonCard } from '@/components/timesheets/SkeletonRow';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPeriod(start: string, end: string) {
  return `${format(parseISO(start), 'MMM d, yyyy')} – ${format(parseISO(end), 'MMM d, yyyy')}`;
}

// ── Modal component ───────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ title, description, children, onClose }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="relative z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all">
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

// ── Info card ─────────────────────────────────────────────────────────────────

function InfoCard({ title, items }: { title: string; items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
      </div>
      <dl className="divide-y divide-zinc-100">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-start gap-4 px-5 py-3">
            <dt className="w-36 shrink-0 text-xs font-medium text-zinc-400 pt-0.5">{label}</dt>
            <dd className="flex-1 text-sm font-semibold text-zinc-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientManagerTimesheetReview() {
  const router = useRouter();
  const params = useParams();
  const timesheetId = params.id as string;

  const [timesheet, setTimesheet]     = useState<Timesheet | null>(null);
  const [auditLog, setAuditLog]       = useState<AuditLogEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [error, setError]             = useState('');
  const [showAudit, setShowAudit]     = useState(false);

  const [showRejectModal, setShowRejectModal]   = useState(false);
  const [rejectionReason, setRejectionReason]   = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');

  // ── Data loading ────────────────────────────────────────────────────────

  const loadTimesheet = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Uses the manager-scoped endpoint — fixes the 404 bug
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
    } catch {
      // Audit log is non-critical — don't surface error on main page
    } finally {
      setAuditLoading(false);
    }
  }, [timesheetId]);

  useEffect(() => { loadTimesheet(); }, [loadTimesheet]);

  const handleToggleAudit = () => {
    setShowAudit(prev => {
      if (!prev && !auditLog.length) loadAuditLog();
      return !prev;
    });
  };

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (processing) return;
    try {
      setProcessing(true);
      setError('');
      await clientManagerApi.approve(timesheetId, approvalComments || undefined);
      router.push('/dashboard/client-manager/timesheets');
    } catch (err: any) {
      setError(err.message || 'Failed to approve timesheet.');
      setShowApproveModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || processing) return;
    try {
      setProcessing(true);
      setError('');
      await clientManagerApi.reject(timesheetId, rejectionReason);
      router.push('/dashboard/client-manager/timesheets');
    } catch (err: any) {
      setError(err.message || 'Failed to reject timesheet.');
      setShowRejectModal(false);
    } finally {
      setProcessing(false);
    }
  };

  // ── Entries: only current version ──────────────────────────────────────

  const currentVersion = timesheet?.current_version ?? 1;
  const currentEntries = (timesheet?.entries ?? []).filter(
    e => (e.version ?? 1) === currentVersion
  );

  // ── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-12">
        <div className="h-8 w-48 rounded-lg bg-zinc-200 animate-pulse" />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={8} />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────

  if (!timesheet) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="text-center space-y-4">
          <span className="text-6xl">🔍</span>
          <h2 className="text-xl font-bold text-zinc-900">Timesheet not accessible</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            {error || 'This timesheet could not be loaded. It may not exist or you may not be assigned to review it.'}
          </p>
          <Link
            href="/dashboard/client-manager/timesheets"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to queue
          </Link>
        </div>
      </div>
    );
  }

  const canAct = timesheet.status === 'submitted';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/client-manager/timesheets"
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors mb-2"
          >
            ← Back to queue
          </Link>
          <h2 className="text-2xl font-bold text-zinc-900">Review Timesheet</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Reviewing submission from{' '}
            <span className="font-semibold text-zinc-700">
              {timesheet.candidate_name ?? 'Candidate'}
            </span>
          </p>
        </div>
        <TimesheetStatusBadge status={timesheet.status} />
      </div>

      {/* ── Inline error ── */}
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-red-50 p-4 border border-red-200">
          <span className="text-red-500">⚠</span>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* ── Candidate details ── */}
      <InfoCard
        title="Candidate"
        items={[
          { label: 'Full Name',    value: timesheet.candidate_name ?? '—' },
          { label: 'Email',        value: timesheet.candidate_email ?? '—' },
          { label: 'Employee ID',  value: (
            <span className="font-mono text-xs bg-zinc-100 rounded px-1.5 py-0.5">
              {timesheet.candidate_id.split('-')[0].toUpperCase()}
            </span>
          )},
        ]}
      />

      {/* ── Timesheet summary ── */}
      <InfoCard
        title="Timesheet Details"
        items={[
          { label: 'Period',         value: formatPeriod(timesheet.period_start_date, timesheet.period_end_date) },
          { label: 'Total Hours',    value: <span className="text-xl font-bold text-indigo-600">{timesheet.total_hours}h</span> },
          { label: 'Shared With',    value: timesheet.manager_name ?? '—' },
          { label: 'Submitted',      value: timesheet.submitted_at ? format(parseISO(timesheet.submitted_at), 'MMM d, yyyy HH:mm') : '—' },
          { label: 'Version',        value: `v${currentVersion}` },
          ...(timesheet.rejection_reason ? [{ label: 'Rejection Reason', value: (
            <span className="text-red-700 bg-red-50 rounded px-2 py-0.5 text-xs ring-1 ring-red-200">
              {timesheet.rejection_reason}
            </span>
          )}] : []),
          ...(timesheet.approval_comments ? [{ label: 'Approval Notes', value: timesheet.approval_comments }] : []),
        ]}
      />

      {/* ── Candidate notes ── */}
      {timesheet.notes && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Candidate Notes
          </h3>
          <p className="text-sm text-zinc-700 italic bg-zinc-50 rounded-lg p-3 border border-zinc-200">
            "{timesheet.notes}"
          </p>
        </div>
      )}

      {/* ── Daily entries (current version only) ── */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Daily Entries
          </h3>
          <span className="text-xs text-zinc-400">
            {currentEntries.length} {currentEntries.length === 1 ? 'entry' : 'entries'} · v{currentVersion}
          </span>
        </div>

        {currentEntries.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-400 text-center">No entries recorded.</p>
        ) : (
          <table className="min-w-full divide-y divide-zinc-100" role="table" aria-label="Timesheet daily entries">
            <thead className="bg-zinc-50/50">
              <tr>
                <th scope="col" className="px-5 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-5 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider w-24">Hours</th>
                <th scope="col" className="px-5 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Task Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {currentEntries.map((entry, idx) => (
                <tr key={entry.id ?? idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-zinc-700 whitespace-nowrap">
                    {format(parseISO(entry.date), 'EEE, MMM d')}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-base font-bold text-indigo-600">{entry.hours_worked}h</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-600">{entry.task_description}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50 border-t border-zinc-200">
              <tr>
                <td className="px-5 py-3 text-xs font-semibold text-zinc-500 uppercase">Total</td>
                <td className="px-5 py-3">
                  <span className="text-base font-bold text-indigo-700">{timesheet.total_hours}h</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── Audit history (collapsible) ── */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={handleToggleAudit}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 hover:bg-zinc-100 transition-colors text-left"
          aria-expanded={showAudit}
          aria-controls="audit-panel"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Audit History
          </span>
          <span className="text-zinc-400 text-sm" aria-hidden="true">
            {showAudit ? '▲' : '▼'}
          </span>
        </button>
        {showAudit && (
          <div id="audit-panel" className="p-5">
            {auditLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-zinc-100" />
                ))}
              </div>
            ) : (
              <AuditTimeline entries={auditLog} />
            )}
          </div>
        )}
      </div>

      {/* ── Action bar (submitted timesheets only) ── */}
      {canAct && (
        <div className="sticky bottom-4 z-20">
          <div className="flex items-center justify-end gap-3 rounded-2xl bg-white border border-zinc-200 shadow-xl px-6 py-4">
            <p className="text-sm text-zinc-500 mr-auto hidden sm:block">
              Ready to act on this timesheet?
            </p>
            <button
              type="button"
              disabled={processing}
              onClick={() => { setShowRejectModal(true); setError(''); }}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={() => { setShowApproveModal(true); setError(''); }}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      )}

      {/* ── Approve modal ── */}
      {showApproveModal && (
        <Modal
          title="Approve Timesheet"
          description="Confirm approval. This timesheet will be forwarded to the Finance team for processing."
          onClose={() => !processing && setShowApproveModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="approval-comments" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Approval Comments{' '}
                <span className="text-xs font-normal text-zinc-400">(optional)</span>
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
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowApproveModal(false)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleApprove}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
              >
                {processing ? 'Approving…' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <Modal
          title="Reject Timesheet"
          description="Please provide a clear reason. The candidate will see this feedback and can correct and resubmit."
          onClose={() => !processing && setShowRejectModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Rejection Reason{' '}
                <span className="text-red-500 text-xs" aria-label="required">*</span>
              </label>
              <textarea
                id="rejection-reason"
                rows={4}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="E.g., Missing hours on Thursday. Please verify task descriptions and resubmit."
                aria-required="true"
                aria-describedby="rejection-reason-hint"
                className={`block w-full rounded-lg border py-2 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  rejectionReason.trim() ? 'border-zinc-300 focus:ring-indigo-500' : 'border-red-300 focus:ring-red-500'
                }`}
              />
              <p id="rejection-reason-hint" className="mt-1 text-xs text-zinc-400">
                Required — the candidate will see this message.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim() || processing}
                onClick={handleReject}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
              >
                {processing ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
