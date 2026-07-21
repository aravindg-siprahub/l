import React from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

interface StepSelectPeriodProps {
  selectedType: 'Weekly' | 'Monthly' | null;
  setSelectedType: (type: 'Weekly' | 'Monthly') => void;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  isReadOnly: boolean;
  onNext: () => void;
}

export default function StepSelectPeriod({
  selectedType,
  setSelectedType,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  notes,
  setNotes,
  isReadOnly,
  onNext
}: StepSelectPeriodProps) {

  const handleSelectType = (type: 'Weekly' | 'Monthly') => {
    if (isReadOnly) return;
    setSelectedType(type);
    
    const now = new Date();
    if (type === 'Weekly') {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    }
  };

  const isComplete = startDate && endDate;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-zinc-100 pb-4">
        <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Select Period</h3>
        <p className="mt-1 text-sm text-zinc-500">Choose the type of timesheet and confirm the dates.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Weekly Card */}
        <div
          onClick={() => handleSelectType('Weekly')}
          className={`relative rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
            selectedType === 'Weekly' 
              ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 shadow-md' 
              : isReadOnly ? 'bg-zinc-50 border-zinc-200 opacity-70 cursor-not-allowed' : 'bg-white border-zinc-200 hover:border-indigo-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
              selectedType === 'Weekly' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
            </div>
            <div>
              <h4 className={`text-base font-bold ${selectedType === 'Weekly' ? 'text-indigo-900' : 'text-zinc-900'}`}>Weekly Timesheet</h4>
              <p className={`text-sm ${selectedType === 'Weekly' ? 'text-indigo-700' : 'text-zinc-500'}`}>Standard Mon–Sun logging.</p>
            </div>
          </div>
        </div>

        {/* Monthly Card */}
        <div
          onClick={() => handleSelectType('Monthly')}
          className={`relative rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
            selectedType === 'Monthly' 
              ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 shadow-md' 
              : isReadOnly ? 'bg-zinc-50 border-zinc-200 opacity-70 cursor-not-allowed' : 'bg-white border-zinc-200 hover:border-indigo-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
              selectedType === 'Monthly' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <h4 className={`text-base font-bold ${selectedType === 'Monthly' ? 'text-indigo-900' : 'text-zinc-900'}`}>Monthly Timesheet</h4>
              <p className={`text-sm ${selectedType === 'Monthly' ? 'text-indigo-700' : 'text-zinc-500'}`}>Full calendar month logging.</p>
            </div>
          </div>
        </div>
      </div>

      {(selectedType || (startDate && endDate)) && (
        <div className="bg-zinc-50/50 rounded-xl p-6 border border-zinc-100 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">Period Start Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                disabled={isReadOnly}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-100 disabled:text-zinc-500 transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-2">Period End Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                disabled={isReadOnly}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-100 disabled:text-zinc-500 transition-shadow"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-900 mb-2">Notes (Optional)</label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional context for this timesheet period..."
                className="block w-full rounded-md border-0 py-2.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-100 disabled:text-zinc-500 transition-shadow"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-zinc-100">
        <button
          type="button"
          disabled={!isComplete}
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          Next Step
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
