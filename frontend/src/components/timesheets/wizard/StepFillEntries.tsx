import React, { memo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { TimesheetPayload } from '@/lib/timesheets';
type TimesheetEntryPayload = TimesheetPayload['entries'][0];

interface StepFillEntriesProps {
  entries: TimesheetEntryPayload[];
  onChange: (index: number, field: string, value: string | number) => void;
  isReadOnly: boolean;
  onBack: () => void;
  onNext: () => void;
}

// Memoized row component for performance
const EntryRow = memo(({
  entry,
  index,
  isReadOnly,
  onChange,
  onCopyPrevious
}: {
  entry: TimesheetEntryPayload;
  index: number;
  isReadOnly: boolean;
  onChange: (index: number, field: string, value: string | number) => void;
  onCopyPrevious: (index: number) => void;
}) => {
  const dateObj = parseISO(entry.date);
  const dayName = format(dateObj, 'EEE');
  const dateDisplay = format(dateObj, 'dd MMM yyyy');
  const isWeekend = dayName === 'Sat' || dayName === 'Sun';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Basic keyboard navigation: find next input
      const form = e.currentTarget.closest('form') || document.body;
      const inputs = Array.from(form.querySelectorAll('input:not([disabled])')) as HTMLInputElement[];
      const currentIndex = inputs.indexOf(e.currentTarget);
      if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      }
    }
  };

  return (
    <tr className={`group transition-colors ${isWeekend ? 'bg-zinc-50' : 'bg-white'} hover:bg-indigo-50/30`}>
      <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-zinc-900 sm:pl-6 border-b border-zinc-100">
        <div className="flex items-center h-full">
          <span className={`text-sm ${isWeekend ? 'text-zinc-500' : 'text-zinc-900 font-medium'}`}>
            {dateDisplay}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-500 border-b border-zinc-100 align-top">
        <div className="relative max-w-[120px]">
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            disabled={isReadOnly}
            value={entry.hours_worked === 0 ? '' : entry.hours_worked}
            onChange={e => onChange(index, 'hours_worked', parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className={`block w-full rounded-md border-0 py-2 text-zinc-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm pr-8 transition-shadow
              ${entry.hours_worked > 0 ? 'ring-indigo-200 bg-white' : 'ring-zinc-200 bg-zinc-50'}
              disabled:bg-zinc-50 disabled:text-zinc-500`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 pointer-events-none">h</span>
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-zinc-500 border-b border-zinc-100 align-top">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Describe the work done..."
            disabled={isReadOnly}
            value={entry.task_description}
            onChange={e => onChange(index, 'task_description', e.target.value)}
            onKeyDown={handleKeyDown}
            className={`block w-full rounded-md border-0 py-2 text-zinc-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-indigo-600 sm:text-sm transition-shadow
              ${entry.task_description ? 'ring-indigo-200 bg-white' : 'ring-zinc-200 bg-zinc-50'}
              disabled:bg-zinc-50 disabled:text-zinc-500`}
          />
          {!isReadOnly && index > 0 && (
            <button
              type="button"
              onClick={() => onCopyPrevious(index)}
              title="Copy from previous day"
              className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});
EntryRow.displayName = 'EntryRow';

export default function StepFillEntries({ entries, onChange, isReadOnly, onBack, onNext }: StepFillEntriesProps) {
  
  const handleCopyPrevious = useCallback((index: number) => {
    if (index === 0 || isReadOnly) return;
    const prevEntry = entries[index - 1];
    onChange(index, 'hours_worked', prevEntry.hours_worked);
    onChange(index, 'task_description', prevEntry.task_description);
  }, [entries, onChange, isReadOnly]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Fill Entries</h3>
          <p className="mt-1 text-sm text-zinc-500">Log your daily hours. Press Enter to quickly move to the next field.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200/80 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50 sticky top-0 z-10 ring-1 ring-zinc-200 shadow-sm">
              <tr>
                <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-semibold text-zinc-900 sm:pl-6 w-24">Date</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-zinc-900 w-32">Hours</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-zinc-900">Task Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {entries.map((entry, idx) => (
                <EntryRow
                  key={entry.date}
                  entry={entry}
                  index={idx}
                  isReadOnly={isReadOnly}
                  onChange={onChange}
                  onCopyPrevious={handleCopyPrevious}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Review Timesheet
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
