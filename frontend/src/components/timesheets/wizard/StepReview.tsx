import React from 'react';

interface StepReviewProps {
  workingDays: number;
  totalHours: number;
  submitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function StepReview({ workingDays, totalHours, submitting, onSaveDraft, onSubmit, onBack }: StepReviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="border-b border-zinc-100 pb-4">
        <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Review & Submit</h3>
        <p className="mt-1 text-sm text-zinc-500">Double-check your entries before submitting to your manager.</p>
      </div>

      <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-6 mb-6">
        <h4 className="text-base font-bold text-blue-900 mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pre-submission Checklist
        </h4>
        <ul className="text-sm text-blue-800 space-y-3">
          <li className="flex items-start gap-3">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
            <span>I have reviewed all <strong>{workingDays}</strong> working days.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
            <span>The total hours (<strong>{totalHours}h</strong>) accurately reflect my work.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
            <span>I have included any necessary context in the notes section.</span>
          </li>
        </ul>
      </div>

      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-zinc-900">Ready to complete?</h4>
          <p className="text-xs text-zinc-600 mt-1">Once submitted, your manager will be notified. You cannot edit this timesheet unless it is rejected.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={onSaveDraft}
            className="flex-1 sm:flex-none rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={submitting || totalHours === 0}
            onClick={onSubmit}
            className="flex-1 sm:flex-none rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {submitting ? 'Processing...' : 'Submit & Send to Manager'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-start pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Entries
        </button>
      </div>
    </div>
  );
}
