'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Timesheet, TimesheetPayload, SharePayload, getTimesheetType } from '@/lib/timesheets';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import ShareManagerModal from '@/components/dashboard/ShareManagerModal';

interface Props {
  timesheet: Timesheet | null;
  isNew: boolean;
  loading: boolean;
  error: string;
  successMsg: string;
  backLink: string;
  onSaveDraft: (payload: TimesheetPayload) => Promise<void>;
  onSubmitTimesheet: (payload: TimesheetPayload) => Promise<void>;
  onDownloadPdf: () => Promise<void>;
  onDownloadExcel?: () => Promise<void>;
  onShareWithManager: (payload: SharePayload) => Promise<Timesheet>;
  onTimesheetUpdated?: (updated: Timesheet) => void;
}

export default function TimesheetForm({
  timesheet,
  isNew,
  loading,
  error: serverError,
  successMsg,
  backLink,
  onSaveDraft,
  onSubmitTimesheet,
  onDownloadPdf,
  onDownloadExcel,
  onShareWithManager,
  onTimesheetUpdated
}: Props) {
  const [formData, setFormData] = useState<TimesheetPayload>({
    period_start_date: '',
    period_end_date: '',
    notes: '',
    entries: []
  });

  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [localError, setLocalError] = useState('');

  const error = serverError || localError;

  useEffect(() => {
    if (timesheet) {
      setFormData({
        period_start_date: timesheet.period_start_date,
        period_end_date: timesheet.period_end_date,
        notes: timesheet.notes || '',
        entries: timesheet.entries.map(e => ({
          date: e.date.split('T')[0],
          hours_worked: e.hours_worked,
          task_description: e.task_description
        }))
      });
    }
  }, [timesheet]);

  const handleAddEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [...prev.entries, { date: '', hours_worked: 0, task_description: '' }]
    }));
  };

  const handleRemoveEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index)
    }));
  };

  const handleEntryChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const newEntries = [...prev.entries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, entries: newEntries };
    });
  };

  const totalHours = formData.entries.reduce((sum, e) => sum + (e.hours_worked || 0), 0);
  const workingDays = formData.entries.filter(e => e.date && e.hours_worked > 0).length;

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      setLocalError('');
      await onSaveDraft(formData);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTimesheet = async () => {
    try {
      setSubmitting(true);
      setLocalError('');
      await onSubmitTimesheet(formData);
      setShowSubmitConfirm(false);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to submit timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setLocalError('');
      await onDownloadPdf();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExcelAction = async () => {
    if (!onDownloadExcel) return;
    try {
      setDownloadingExcel(true);
      setLocalError('');
      await onDownloadExcel();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to download Excel.');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleShareSuccess = (updated: Timesheet) => {
    setShowShareModal(false);
    if (onTimesheetUpdated) {
      onTimesheetUpdated(updated);
    }
  };

  const isEditable = isNew || (timesheet && (timesheet.status === 'draft' || timesheet.status === 'client_rejected' || timesheet.status === 'finance_rejected'));
  const isReadOnly = !isEditable;
  const canDownload = Boolean(timesheet && timesheet.status !== 'draft');
  const canShare = Boolean(timesheet && (timesheet.status === 'submitted' || timesheet.status === 'client_rejected' || timesheet.status === 'finance_rejected'));
  const tsType = formData.period_start_date && formData.period_end_date ? getTimesheetType(formData.period_start_date, formData.period_end_date) : null;

  // Workflow Progress Calculation
  const progressSteps = ['Draft', 'Submitted', 'Shared', 'Approved'];
  let currentStepIdx = 0;
  if (!isNew && timesheet) {
    if (timesheet.status === 'client_approved' || timesheet.status === 'finance_approved') currentStepIdx = 3;
    else if (timesheet.shared_at) currentStepIdx = 2;
    else if (timesheet.status === 'submitted') currentStepIdx = 1;
    else currentStepIdx = 0; // Draft or Rejected (rejected is essentially back to draft state but we show banners)
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <svg className="animate-spin h-8 w-8 text-indigo-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-medium">Loading timesheet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {isNew ? 'Create Timesheet' : `Timesheet — ${tsType ?? timesheet?.status}`}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {isNew ? 'Fill in the period and your daily entries, then save or submit.' : 'View or edit your timesheet details and entries.'}
          </p>
        </div>
        <Link href={backLink} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
          ← Back to list
        </Link>
      </div>

      {/* Progress Indicator */}
      {!isNew && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-200 p-6">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
              {progressSteps.map((step, stepIdx) => (
                <li key={step} className={`relative ${stepIdx !== progressSteps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className={`h-0.5 w-full ${stepIdx < currentStepIdx ? 'bg-indigo-600' : 'bg-zinc-200'}`} />
                  </div>
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    stepIdx < currentStepIdx ? 'bg-indigo-600 hover:bg-indigo-900' :
                    stepIdx === currentStepIdx ? 'bg-white border-2 border-indigo-600' : 'bg-white border-2 border-zinc-300'
                  }`}>
                    {stepIdx < currentStepIdx ? (
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    ) : stepIdx === currentStepIdx ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent" aria-hidden="true" />
                    )}
                  </div>
                  <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                    stepIdx <= currentStepIdx ? 'text-indigo-600' : 'text-zinc-500'
                  }`}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}

      {/* Banners */}
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 flex items-start gap-3">
            <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
          </div>
        )}
        {timesheet?.status === 'client_rejected' && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <h3 className="text-sm font-bold text-red-800">Timesheet Rejected by Client Manager</h3>
            <p className="mt-2 text-sm text-red-700">{timesheet.rejection_reason || 'No reason provided.'}</p>
            <p className="mt-2 text-sm font-medium text-red-700">Please update your entries and resubmit.</p>
          </div>
        )}
        {timesheet?.status === 'finance_rejected' && (
          <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
            <h3 className="text-sm font-bold text-orange-800">Timesheet Rejected by Finance Team</h3>
            <p className="mt-2 text-sm text-orange-700">{timesheet.rejection_reason || 'No reason provided.'}</p>
            <p className="mt-2 text-sm font-medium text-orange-700">Please correct the issues and resubmit for review.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Timesheet Information */}
          <section className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4">
              <h3 className="text-base font-semibold text-zinc-900">1. Timesheet Information</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Period Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    disabled={isReadOnly}
                    value={formData.period_start_date}
                    onChange={e => setFormData(prev => ({ ...prev, period_start_date: e.target.value }))}
                    className="block w-full rounded-md border-0 py-2 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Period End Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    disabled={isReadOnly}
                    value={formData.period_end_date}
                    onChange={e => setFormData(prev => ({ ...prev, period_end_date: e.target.value }))}
                    className="block w-full rounded-md border-0 py-2 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
                  />
                </div>
                {tsType && (
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Period Type:</span>
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      tsType === 'Weekly' ? 'bg-sky-50 text-sky-700 ring-sky-700/20' : 'bg-amber-50 text-amber-700 ring-amber-700/20'
                    }`}>
                      {tsType}
                    </span>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-900 mb-2">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    value={formData.notes || ''}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional context for this timesheet period..."
                    className="block w-full rounded-md border-0 py-2 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Work Entries */}
          <section className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900">2. Daily Work Entries</h3>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddEntry}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Add Entry
                </button>
              )}
            </div>
            <div className="p-6">
              {formData.entries.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
                  <span className="text-4xl block mb-3">📝</span>
                  <p className="text-sm font-medium text-zinc-900">No entries added yet.</p>
                  <p className="text-xs text-zinc-500 mt-1">Log your daily hours to build your timesheet.</p>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAddEntry}
                      className="mt-4 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
                    >
                      + Add your first entry
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.entries.map((entry, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-xl ring-1 ring-zinc-200 shadow-sm">
                      <div className="w-full sm:w-40">
                        <label className="block text-xs font-semibold text-zinc-700 sm:hidden mb-1.5">Date</label>
                        <input
                          type="date"
                          disabled={isReadOnly}
                          value={entry.date}
                          onChange={e => handleEntryChange(idx, 'date', e.target.value)}
                          className="block w-full rounded-md border-0 py-2 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-50"
                        />
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="block text-xs font-semibold text-zinc-700 sm:hidden mb-1.5">Hours</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            disabled={isReadOnly}
                            value={entry.hours_worked}
                            onChange={e => handleEntryChange(idx, 'hours_worked', parseFloat(e.target.value) || 0)}
                            className="block w-full rounded-md border-0 py-2 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-50 pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 pointer-events-none">h</span>
                        </div>
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-zinc-700 sm:hidden mb-1.5">Task Description</label>
                        <input
                          type="text"
                          placeholder="Describe the work done..."
                          disabled={isReadOnly}
                          value={entry.task_description}
                          onChange={e => handleEntryChange(idx, 'task_description', e.target.value)}
                          className="block w-full rounded-md border-0 py-2 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-50"
                        />
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEntry(idx)}
                          className="text-zinc-400 hover:text-red-500 mt-6 sm:mt-0 p-1 transition-colors"
                          title="Remove entry"
                        >
                          <span className="sr-only">Remove</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Review & Submit */}
          {isEditable && (
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-200 overflow-hidden">
              <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4">
                <h3 className="text-base font-semibold text-zinc-900">3. Review & Submit</h3>
              </div>
              <div className="p-6">
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-5 mb-6">
                  <h4 className="text-sm font-semibold text-zinc-900 mb-2">Pre-submission Checklist</h4>
                  <ul className="text-sm text-zinc-600 space-y-2 list-disc list-inside">
                    <li>I have reviewed all {workingDays} work entries.</li>
                    <li>The total hours ({totalHours}h) accurately reflects my work.</li>
                    <li>I have included any necessary context in the notes section.</li>
                  </ul>
                </div>

                {showSubmitConfirm ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-blue-900">Confirm Submission</h4>
                      <p className="text-xs text-blue-800 mt-1">Once submitted, you cannot edit this timesheet unless it is rejected.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowSubmitConfirm(false)}
                        className="flex-1 sm:flex-none rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmitTimesheet}
                        className="flex-1 sm:flex-none rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? 'Submitting...' : 'Confirm Submit'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSaveDraft}
                      className="w-full sm:w-auto rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                      type="button"
                      disabled={submitting || formData.entries.length === 0}
                      onClick={() => setShowSubmitConfirm(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                    >
                      Submit for Approval
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 4: Post-Submission Actions */}
          {!isNew && canShare && (
            <section className="bg-white rounded-xl shadow-sm ring-1 ring-zinc-200 overflow-hidden">
              <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4">
                <h3 className="text-base font-semibold text-zinc-900">4. Share with Client Manager</h3>
              </div>
              <div className="p-6">
                {timesheet?.shared_at ? (
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-5 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">📤</span>
                        <h4 className="text-sm font-bold text-violet-900">Currently Shared</h4>
                      </div>
                      <p className="text-sm text-violet-800 ml-7">
                        Shared with <span className="font-semibold">{timesheet.manager_name || timesheet.manager_email}</span> on {format(parseISO(timesheet.shared_at), 'MMM d, yyyy')}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm ring-1 ring-inset ring-violet-300 hover:bg-violet-100 transition-colors ml-7 sm:ml-0"
                    >
                      Resend / Change Manager
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center mb-6">
                    <span className="text-4xl block mb-3">📬</span>
                    <h4 className="text-sm font-bold text-zinc-900 mb-1">Share with your Client Manager</h4>
                    <p className="text-sm text-zinc-600 mb-4 max-w-md mx-auto">
                      Your timesheet is submitted. Send it to your manager via email to notify them it's ready for review.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                    >
                      Share Now
                    </button>
                  </div>
                )}
                
                {canDownload && (
                  <div className="flex items-center justify-center sm:justify-start gap-4 pt-4 border-t border-zinc-200">
                    <button
                      type="button"
                      disabled={downloading}
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50 transition-colors"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      {downloading ? 'Downloading...' : 'Download PDF Copy'}
                    </button>
                    {onDownloadExcel && (
                      <button
                        type="button"
                        disabled={downloadingExcel}
                        onClick={handleDownloadExcelAction}
                        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        {downloadingExcel ? 'Downloading...' : 'Download Excel Copy'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-zinc-900 rounded-xl shadow-lg ring-1 ring-zinc-950/5 p-6 text-white overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 text-zinc-800/50 opacity-20 transform rotate-12 pointer-events-none">
              <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-white mb-6 relative z-10">Live Summary</h3>
            
            <dl className="space-y-6 relative z-10">
              <div>
                <dt className="text-sm font-medium text-zinc-400">Total Hours</dt>
                <dd className="mt-1 text-4xl font-black text-indigo-400 tracking-tight">{totalHours}<span className="text-2xl text-indigo-500 font-bold ml-1">h</span></dd>
              </div>
              
              <div className="pt-6 border-t border-zinc-800">
                <dt className="text-sm font-medium text-zinc-400">Working Days</dt>
                <dd className="mt-1 text-2xl font-bold text-white">{workingDays} <span className="text-base font-normal text-zinc-500">days logged</span></dd>
              </div>
              
              <div className="pt-6 border-t border-zinc-800">
                <dt className="text-sm font-medium text-zinc-400">Current Status</dt>
                <dd className="mt-2">
                  <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ring-1 ring-inset ${
                    timesheet?.status === 'submitted' || timesheet?.status === 'client_approved' || timesheet?.status === 'finance_approved'
                      ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                      : timesheet?.status === 'client_rejected' || timesheet?.status === 'finance_rejected'
                      ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                      : 'bg-zinc-500/10 text-zinc-300 ring-zinc-500/20'
                  }`}>
                    {timesheet?.status ? timesheet.status.replace('_', ' ').toUpperCase() : 'DRAFT'}
                  </span>
                </dd>
              </div>
            </dl>

            {!isNew && timesheet?.updated_at && (
              <div className="mt-8 pt-6 border-t border-zinc-800 text-xs text-zinc-500 relative z-10">
                Last saved {formatDistanceToNow(parseISO(timesheet.updated_at), { addSuffix: true })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && timesheet && (
        <ShareManagerModal
          onClose={() => setShowShareModal(false)}
          onConfirmShare={(payload) => onShareWithManager(payload)}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
}
