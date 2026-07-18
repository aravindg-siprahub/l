'use client';

import { useState, useEffect } from 'react';
import { Timesheet, SharePayload } from '@/lib/timesheets';
import { format, parseISO } from 'date-fns';

interface Props {
  timesheet?: Timesheet | null;
  onClose: () => void;
  onConfirmShare: (payload: SharePayload) => Promise<Timesheet>;
  onSuccess: (updated: Timesheet) => void;
}

export default function ShareManagerModal({ timesheet, onClose, onConfirmShare, onSuccess }: Props) {
  const [managerName,  setManagerName]  = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [sending,      setSending]      = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (timesheet) {
      if (timesheet.manager_name) setManagerName(timesheet.manager_name);
      if (timesheet.manager_email) setManagerEmail(timesheet.manager_email);
    }
  }, [timesheet]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleSend = async () => {
    setError('');

    if (!managerEmail.trim()) {
      setError('Manager email is required.');
      return;
    }
    if (!validateEmail(managerEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (sending) return;

    try {
      setSending(true);
      const updated = await onConfirmShare({
        manager_email: managerEmail.trim(),
        manager_name:  managerName.trim() || undefined,
      });
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to share timesheet.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !sending) handleSend();
    if (e.key === 'Escape') onClose();
  };

  const isResend = Boolean(timesheet?.shared_at);

  return (
    <div className="relative z-10" aria-labelledby="share-modal-title" role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
      <div className="fixed inset-0 bg-zinc-500 bg-opacity-75 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📤</span>
                <div>
                  <h3 className="text-base font-semibold text-white" id="share-modal-title">
                    {isResend ? 'Resend Timesheet' : 'Share with Manager'}
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    The manager will receive this timesheet as a PDF attachment.
                  </p>
                </div>
              </div>
              <button type="button" disabled={sending} onClick={onClose} className="text-indigo-200 hover:text-white transition-colors disabled:opacity-50">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {isResend && timesheet && timesheet.shared_at && (
                <div className="rounded-lg bg-violet-50 p-4 border border-violet-200 text-sm text-violet-800">
                  <p className="font-semibold mb-1">Status: Currently Shared</p>
                  <p>This timesheet was last sent on {format(parseISO(timesheet.shared_at), 'MMM d, yyyy h:mm a')}. You can resend it to the same manager or change the details below.</p>
                </div>
              )}

              <div>
                <label htmlFor="share-manager-name" className="block text-sm font-medium text-zinc-900">
                  Manager Name <span className="ml-1 text-xs font-normal text-zinc-400">(optional)</span>
                </label>
                <input
                  id="share-manager-name"
                  type="text"
                  autoComplete="name"
                  value={managerName}
                  onChange={e => setManagerName(e.target.value)}
                  disabled={sending}
                  placeholder="e.g. Jane Smith"
                  className="mt-1.5 block w-full rounded-lg border-0 py-2 px-3 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm disabled:bg-zinc-50"
                />
              </div>

              <div>
                <label htmlFor="share-manager-email" className="block text-sm font-medium text-zinc-900">
                  Manager Email <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="share-manager-email"
                  type="email"
                  autoComplete="email"
                  value={managerEmail}
                  onChange={e => { setManagerEmail(e.target.value); setError(''); }}
                  disabled={sending}
                  placeholder="manager@company.com"
                  className={`mt-1.5 block w-full rounded-lg border-0 py-2 px-3 text-zinc-900 shadow-sm ring-1 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-inset sm:text-sm disabled:bg-zinc-50 ${
                    error && error.toLowerCase().includes('email') ? 'ring-red-400 focus:ring-red-500' : 'ring-zinc-300 focus:ring-indigo-600'
                  }`}
                />
              </div>

              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                <p className="text-xs font-medium text-indigo-800 mb-1">📎 What the manager receives</p>
                <ul className="text-xs text-indigo-700 space-y-0.5">
                  <li>• An email with your timesheet details in the body</li>
                  <li>• A downloadable PDF with all daily entries attached</li>
                </ul>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200 flex items-start gap-2">
                  <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-200">
              <button type="button" disabled={sending} onClick={onClose} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
              <button type="button" disabled={sending || !managerEmail.trim()} onClick={handleSend} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50">
                {sending ? 'Sending...' : (isResend ? 'Resend Timesheet' : 'Send to Manager')}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
