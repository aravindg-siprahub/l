'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { timesheetsApi, Timesheet, TimesheetPayload } from '@/lib/timesheets';

export default function TimesheetFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  
  const [formData, setFormData] = useState<TimesheetPayload>({
    period_start_date: '',
    period_end_date: '',
    notes: '',
    entries: []
  });

  useEffect(() => {
    if (!isNew) {
      loadTimesheet();
    }
  }, [isNew, params.id]);

  const loadTimesheet = async () => {
    try {
      setLoading(true);
      const data = await timesheetsApi.getById(params.id as string);
      setTimesheet(data);
      setFormData({
        period_start_date: data.period_start_date,
        period_end_date: data.period_end_date,
        notes: data.notes || '',
        entries: data.entries.map(e => ({
          date: e.date.split('T')[0],
          hours_worked: e.hours_worked,
          task_description: e.task_description
        }))
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheet.');
    } finally {
      setLoading(false);
    }
  };

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

  const saveDraft = async () => {
    try {
      setSubmitting(true);
      setError('');
      if (isNew) {
        await timesheetsApi.create(formData);
      } else {
        await timesheetsApi.update(params.id as string, formData);
      }
      router.push('/dashboard/candidate/timesheets');
    } catch (err: any) {
      setError(err.message || 'Failed to save timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitTimesheet = async () => {
    try {
      setSubmitting(true);
      setError('');
      let currentId = params.id as string;
      
      // Save first
      if (isNew) {
        const created = await timesheetsApi.create(formData);
        currentId = created.id;
      } else {
        await timesheetsApi.update(currentId, formData);
      }

      // Then submit
      await timesheetsApi.submit(currentId);
      router.push('/dashboard/candidate/timesheets');
    } catch (err: any) {
      setError(err.message || 'Failed to submit timesheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnly = Boolean(timesheet && (timesheet.status !== 'draft' && timesheet.status !== 'client_rejected'));

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">
            {isNew ? 'Create Timesheet' : `Timesheet: ${timesheet?.status}`}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Fill in your daily hours and descriptions.</p>
        </div>
        <Link href="/dashboard/candidate/timesheets" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          &larr; Back to list
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {timesheet?.status === 'client_rejected' && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <h3 className="text-sm font-semibold text-red-800">Timesheet Rejected by Client Manager</h3>
          <p className="mt-2 text-sm text-red-700">{timesheet.rejection_reason || 'No reason provided.'}</p>
          <p className="mt-2 text-sm text-red-700 italic">Please update your entries and resubmit.</p>
        </div>
      )}

      {timesheet?.status === 'finance_rejected' && (
        <div className="rounded-md bg-orange-50 p-4 border border-orange-200">
          <h3 className="text-sm font-semibold text-orange-800">Timesheet Rejected by Finance Team</h3>
          <p className="mt-2 text-sm text-orange-700">{timesheet.rejection_reason || 'No reason provided.'}</p>
          <p className="mt-2 text-sm text-orange-700 italic">Please correct the issues and resubmit for review.</p>
        </div>
      )}

      <div className="bg-white shadow-sm ring-1 ring-zinc-200 sm:rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50/50 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium leading-6 text-zinc-900">Period Start Date *</label>
              <input
                type="date"
                required
                disabled={isReadOnly}
                value={formData.period_start_date}
                onChange={e => setFormData(prev => ({ ...prev, period_start_date: e.target.value }))}
                className="mt-2 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-zinc-100 disabled:text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-zinc-900">Period End Date *</label>
              <input
                type="date"
                required
                disabled={isReadOnly}
                value={formData.period_end_date}
                onChange={e => setFormData(prev => ({ ...prev, period_end_date: e.target.value }))}
                className="mt-2 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-zinc-100 disabled:text-zinc-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium leading-6 text-zinc-900">Notes (Optional)</label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={formData.notes || ''}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-2 block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-zinc-100 disabled:text-zinc-500"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-zinc-900">Daily Entries</h3>
            {!isReadOnly && (
              <button type="button" onClick={handleAddEntry} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                + Add Entry
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {formData.entries.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center border-2 border-dashed border-zinc-200 rounded-lg">No entries added yet.</p>
            ) : (
              formData.entries.map((entry, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                  <div className="w-full sm:w-40">
                    <label className="block text-xs font-medium text-zinc-700 sm:hidden mb-1">Date</label>
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={entry.date}
                      onChange={e => handleEntryChange(idx, 'date', e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-zinc-100"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-medium text-zinc-700 sm:hidden mb-1">Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      disabled={isReadOnly}
                      value={entry.hours_worked}
                      onChange={e => handleEntryChange(idx, 'hours_worked', parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-zinc-100"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-zinc-700 sm:hidden mb-1">Task Description</label>
                    <input
                      type="text"
                      placeholder="Task description..."
                      disabled={isReadOnly}
                      value={entry.task_description}
                      onChange={e => handleEntryChange(idx, 'task_description', e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-zinc-100"
                    />
                  </div>
                  {!isReadOnly && (
                    <button type="button" onClick={() => handleRemoveEntry(idx)} className="text-zinc-400 hover:text-red-500 mt-6 sm:mt-0 px-2">
                      <span className="sr-only">Remove</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 flex justify-end text-sm font-medium text-zinc-700">
            Total Hours: <span className="ml-2 font-bold text-zinc-900">{formData.entries.reduce((sum, e) => sum + (e.hours_worked || 0), 0)}h</span>
          </div>
        </div>
        
        {!isReadOnly && (
          <div className="bg-zinc-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-200">
            <button
              type="button"
              disabled={submitting}
              onClick={saveDraft}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submitTimesheet}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              Submit Timesheet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
