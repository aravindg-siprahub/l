'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { timesheetsApi, Timesheet } from '@/lib/timesheets';
import { format, parseISO } from 'date-fns';

export default function ClientManagerTimesheetReview() {
  const router = useRouter();
  const params = useParams();
  
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    loadTimesheet();
  }, [params.id]);

  const loadTimesheet = async () => {
    try {
      setLoading(true);
      const data = await timesheetsApi.getById(params.id as string);
      setTimesheet(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheet details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      setError('');
      await timesheetsApi.clientApprove(timesheet!.id, approvalComments);
      router.push('/dashboard/client-manager/timesheets');
    } catch (err: any) {
      setError(err.message || 'Failed to approve timesheet.');
      setProcessing(false);
      setShowApproveModal(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    try {
      setProcessing(true);
      setError('');
      await timesheetsApi.clientReject(timesheet!.id, rejectionReason);
      router.push('/dashboard/client-manager/timesheets');
    } catch (err: any) {
      setError(err.message || 'Failed to reject timesheet.');
      setProcessing(false);
      setShowRejectModal(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading timesheet...</div>;
  if (!timesheet) return <div className="p-8 text-center text-red-500">Timesheet not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Review Timesheet</h2>
          <p className="mt-1 text-sm text-zinc-500">Candidate ID: {timesheet.candidate_id}</p>
        </div>
        <Link href="/dashboard/client-manager/timesheets" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          &larr; Back to Queue
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm ring-1 ring-zinc-200 sm:rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50/50 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-500">Period</h3>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {format(parseISO(timesheet.period_start_date), 'MMM d, yyyy')} &mdash; {format(parseISO(timesheet.period_end_date), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-500">Total Hours</h3>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{timesheet.total_hours}h</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-500">Status</h3>
            <span className="mt-2 inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
              Pending Client Approval
            </span>
          </div>
        </div>

        {timesheet.notes && (
          <div className="p-6 border-b border-zinc-200">
            <h3 className="text-sm font-medium text-zinc-900 mb-2">Candidate Notes</h3>
            <div className="bg-zinc-50 rounded-md p-4 text-sm text-zinc-700 italic border border-zinc-200">
              "{timesheet.notes}"
            </div>
          </div>
        )}

        <div className="p-6">
          <h3 className="text-lg font-medium text-zinc-900 mb-4">Daily Entries</h3>
          <div className="space-y-3">
            {timesheet.entries.map((entry, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
                <div className="w-full sm:w-32 shrink-0">
                  <div className="text-sm font-semibold text-zinc-900">{format(parseISO(entry.date), 'EEE, MMM d')}</div>
                </div>
                <div className="w-full sm:w-20 shrink-0">
                  <div className="text-lg font-bold text-zinc-700">{entry.hours_worked}h</div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-600">{entry.task_description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {timesheet.status === 'submitted' && (
          <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-200">
            <button
              type="button"
              disabled={processing}
              onClick={() => setShowRejectModal(true)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50"
            >
              Reject Timesheet
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={() => setShowApproveModal(true)}
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              Approve Timesheet
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <h3 className="text-lg font-semibold leading-6 text-zinc-900" id="modal-title">Reject Timesheet</h3>
                  <div className="mt-2">
                    <p className="text-sm text-zinc-500">
                      Please provide a reason for rejecting this timesheet. This will be sent back to the candidate so they can correct it.
                    </p>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-3 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="E.g., Missing hours on Thursday, please verify task description."
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    disabled={!rejectionReason.trim() || processing}
                    onClick={handleReject}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:col-start-2 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm Reject'}
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => setShowRejectModal(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <h3 className="text-lg font-semibold leading-6 text-zinc-900" id="modal-title">Approve Timesheet</h3>
                  <div className="mt-2">
                    <p className="text-sm text-zinc-500">
                      Are you sure you want to approve this timesheet? It will be forwarded to the Finance Team for final invoicing.
                    </p>
                    <textarea
                      rows={2}
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      className="mt-3 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      placeholder="Optional comments for finance..."
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleApprove}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => setShowApproveModal(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
