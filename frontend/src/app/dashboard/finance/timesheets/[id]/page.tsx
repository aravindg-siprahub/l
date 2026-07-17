'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { timesheetsApi, Timesheet } from '@/lib/timesheets';
import { financeApi, Invoice, FinanceApprovePayload } from '@/lib/finance';
import { format, parseISO } from 'date-fns';

export default function FinanceTimesheetReview() {
  const router = useRouter();
  const params = useParams();

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Approval form state
  const [hourlyRate, setHourlyRate] = useState('150');
  const [taxRate, setTaxRate] = useState('0');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [financeNotes, setFinanceNotes] = useState('');

  useEffect(() => {
    timesheetsApi.getById(params.id as string)
      .then(setTimesheet)
      .catch((e: any) => setError(e.message || 'Failed to load timesheet.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const rate = parseFloat(hourlyRate) || 0;
  const tax = parseFloat(taxRate) || 0;
  const subtotal = timesheet ? Math.round(timesheet.total_hours * rate * 100) / 100 : 0;
  const taxAmt = Math.round(subtotal * tax * 100) / 100;
  const total = Math.round((subtotal + taxAmt) * 100) / 100;

  const handleApprove = async () => {
    if (!timesheet) return;
    try {
      setProcessing(true);
      setError('');
      const payload: FinanceApprovePayload = {
        hourly_rate: rate,
        tax_rate: tax,
        payment_terms: paymentTerms,
        notes: financeNotes || undefined,
      };
      const invoice: Invoice = await financeApi.approve(timesheet.id, payload);
      router.push(`/dashboard/finance/invoices/${invoice.id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to approve timesheet.');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!timesheet || !rejectionReason.trim()) return;
    try {
      setProcessing(true);
      setError('');
      await financeApi.reject(timesheet.id, rejectionReason);
      router.push('/dashboard/finance/timesheets');
    } catch (e: any) {
      setError(e.message || 'Failed to reject timesheet.');
      setProcessing(false);
      setShowRejectModal(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading timesheet...</div>;
  if (!timesheet) return <div className="p-8 text-center text-red-500">Timesheet not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Finance Review</h2>
          <p className="mt-1 text-sm text-zinc-500">Candidate ID: {timesheet.candidate_id}</p>
        </div>
        <Link href="/dashboard/finance/timesheets" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Back to Queue
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timesheet Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Period header */}
          <div className="bg-white shadow-sm ring-1 ring-zinc-200 rounded-xl overflow-hidden">
            <div className="p-5 bg-zinc-50/60 border-b border-zinc-200 flex flex-wrap gap-6 justify-between items-center">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Period</p>
                <p className="mt-0.5 text-lg font-bold text-zinc-900">
                  {format(parseISO(timesheet.period_start_date), 'MMM d, yyyy')} – {format(parseISO(timesheet.period_end_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Hours</p>
                <p className="mt-0.5 text-2xl font-bold text-indigo-600">{timesheet.total_hours}h</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Submitted</p>
                <p className="mt-0.5 text-sm font-medium text-zinc-900">
                  {timesheet.submitted_at ? format(parseISO(timesheet.submitted_at), 'MMM d, yyyy') : '—'}
                </p>
              </div>
            </div>

            {/* Client Manager approval info */}
            {timesheet.approval_comments && (
              <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Client Manager Notes</p>
                <p className="text-sm text-indigo-800 italic">"{timesheet.approval_comments}"</p>
              </div>
            )}

            {/* Candidate notes */}
            {timesheet.notes && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Candidate Notes</p>
                <p className="text-sm text-amber-800 italic">"{timesheet.notes}"</p>
              </div>
            )}

            {/* Daily Entries */}
            <div className="p-5">
              <p className="text-sm font-semibold text-zinc-900 mb-4">Daily Work Log</p>
              <div className="rounded-lg ring-1 ring-zinc-200 overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-900">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Task Description</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-white uppercase tracking-wider">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {timesheet.entries.map((entry, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-indigo-50/30'}>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900 whitespace-nowrap">
                          {format(parseISO(entry.date), 'EEE, MMM d')}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-600">{entry.task_description}</td>
                        <td className="px-4 py-3 text-sm font-bold text-zinc-900 text-right">{entry.hours_worked}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Approval Panel */}
        <div className="space-y-4">
          <div className="bg-white shadow-sm ring-1 ring-zinc-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-zinc-900">
              <h3 className="text-sm font-semibold text-white">Invoice Configuration</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Configure billing details before approving</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Tax Rate (0–1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={taxRate}
                  onChange={e => setTaxRate(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Finance Notes (optional)</label>
                <textarea
                  rows={2}
                  value={financeNotes}
                  onChange={e => setFinanceNotes(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  placeholder="Internal notes..."
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="mx-5 mb-5 rounded-lg bg-zinc-50 ring-1 ring-zinc-200 overflow-hidden">
              <div className="px-4 py-2 bg-zinc-200">
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Invoice Preview</p>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>{timesheet.total_hours}h × ${rate.toFixed(2)}</span>
                  <span className="font-medium text-zinc-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Tax ({(tax * 100).toFixed(0)}%)</span>
                  <span className="font-medium text-zinc-900">${taxAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-300 pt-2 font-bold text-zinc-900">
                  <span>Total Due</span>
                  <span className="text-indigo-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-2">
              <button
                type="button"
                disabled={processing || rate <= 0}
                onClick={handleApprove}
                className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {processing ? 'Generating Invoice...' : '✓ Approve & Generate Invoice'}
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowRejectModal(true)}
                className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50"
              >
                ✕ Reject Timesheet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="relative z-10" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-75"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <h3 className="text-lg font-semibold text-zinc-900">Reject Timesheet</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Provide a clear reason. The timesheet will be returned to the Candidate for correction.
                </p>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="mt-3 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                  placeholder="E.g. Hours don't match client PO. Please review week ending Jun 20."
                />
                <div className="mt-5 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    disabled={!rejectionReason.trim() || processing}
                    onClick={handleReject}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-2 disabled:opacity-50"
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
    </div>
  );
}
