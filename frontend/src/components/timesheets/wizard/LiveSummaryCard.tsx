import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Timesheet } from '@/lib/timesheets';

interface LiveSummaryCardProps {
  totalHours: number;
  workingDays: number;
  timesheet: Timesheet | null;
  isNew: boolean;
  tsType: string | null;
}

export default function LiveSummaryCard({ totalHours, workingDays, timesheet, isNew, tsType }: LiveSummaryCardProps) {
  return (
    <div className="sticky top-6 bg-white rounded-xl shadow-sm border border-zinc-200/80 p-6 overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-indigo-500 to-blue-500" />
      
      <h3 className="text-lg font-bold text-zinc-900 mb-6 tracking-tight">Live Summary</h3>
      
      <dl className="space-y-6 relative z-10">
        {tsType && (
          <div>
            <dt className="text-sm font-medium text-zinc-500">Period Type</dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                tsType === 'Weekly' ? 'bg-sky-50 text-sky-700 ring-sky-700/20' : 'bg-amber-50 text-amber-700 ring-amber-700/20'
              }`}>
                {tsType}
              </span>
            </dd>
          </div>
        )}

        <div className={tsType ? "pt-6 border-t border-zinc-100" : ""}>
          <dt className="text-sm font-medium text-zinc-500">Total Hours</dt>
          <dd className="mt-1 text-4xl font-black text-indigo-600 tracking-tight">{totalHours}<span className="text-2xl text-indigo-400 font-bold ml-1">h</span></dd>
        </div>
        
        <div className="pt-6 border-t border-zinc-100">
          <dt className="text-sm font-medium text-zinc-500">Working Days</dt>
          <dd className="mt-1 text-2xl font-bold text-zinc-900">{workingDays} <span className="text-sm font-normal text-zinc-400">days logged</span></dd>
        </div>
        
        <div className="pt-6 border-t border-zinc-100">
          <dt className="text-sm font-medium text-zinc-500">Current Status</dt>
          <dd className="mt-2">
            <span className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold tracking-wide uppercase ${
              timesheet?.status === 'submitted' || timesheet?.status === 'client_approved' || timesheet?.status === 'finance_approved'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                : timesheet?.status === 'client_rejected' || timesheet?.status === 'finance_rejected'
                ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                : 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/20'
            }`}>
              {timesheet?.status ? timesheet.status.replace('_', ' ') : 'DRAFT'}
            </span>
          </dd>
        </div>
      </dl>

      {!isNew && timesheet?.updated_at && (
        <div className="mt-8 pt-6 border-t border-zinc-100 text-xs text-zinc-500 relative z-10">
          Last saved {formatDistanceToNow(parseISO(timesheet.updated_at), { addSuffix: true })}
        </div>
      )}
    </div>
  );
}
