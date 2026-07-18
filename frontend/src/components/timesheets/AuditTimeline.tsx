/**
 * AuditTimeline
 * Renders a chronological list of audit log entries as a vertical timeline.
 * Used in the review detail page to show the full approval history.
 */
'use client';

import { format, parseISO } from 'date-fns';
import { AuditLogEntry } from '@/lib/client-manager';

const ACTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  submitted:       { label: 'Submitted',        icon: '📤', color: 'bg-indigo-100 text-indigo-700' },
  resubmitted:     { label: 'Resubmitted',      icon: '🔄', color: 'bg-violet-100 text-violet-700' },
  shared:          { label: 'Shared with Manager', icon: '📨', color: 'bg-blue-100 text-blue-700' },
  client_approved: { label: 'Approved',         icon: '✅', color: 'bg-emerald-100 text-emerald-700' },
  client_rejected: { label: 'Rejected',         icon: '❌', color: 'bg-red-100 text-red-700' },
  finance_approved:{ label: 'Finance Approved', icon: '💳', color: 'bg-teal-100 text-teal-700' },
  finance_rejected:{ label: 'Finance Rejected', icon: '⚠️', color: 'bg-orange-100 text-orange-700' },
};

interface Props {
  entries: AuditLogEntry[];
}

export default function AuditTimeline({ entries }: Props) {
  if (!entries.length) {
    return (
      <p className="text-sm text-zinc-400 py-4 text-center">
        No audit history available yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-zinc-200 space-y-6 ml-3">
      {entries.map((entry, idx) => {
        const cfg = ACTION_CONFIG[entry.action] ?? {
          label: entry.action,
          icon: '📋',
          color: 'bg-zinc-100 text-zinc-700',
        };
        return (
          <li key={entry.id} className="ml-6">
            <span
              className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white text-xs ${cfg.color}`}
              aria-hidden="true"
            >
              {cfg.icon}
            </span>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{cfg.label}</p>
                  {entry.actor_name && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      by <span className="font-medium text-zinc-700">{entry.actor_name}</span>
                      <span className="ml-1 text-zinc-400">({entry.actor_role.replace('_', ' ')})</span>
                    </p>
                  )}
                </div>
                <time
                  dateTime={entry.created_at}
                  className="text-xs text-zinc-400 whitespace-nowrap"
                  title={entry.created_at}
                >
                  {format(parseISO(entry.created_at), 'MMM d, yyyy HH:mm')}
                </time>
              </div>
              {entry.comments && (
                <div className="mt-2 rounded-md bg-zinc-50 border border-zinc-200 px-3 py-2">
                  <p className="text-sm text-zinc-700 italic">"{entry.comments}"</p>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
