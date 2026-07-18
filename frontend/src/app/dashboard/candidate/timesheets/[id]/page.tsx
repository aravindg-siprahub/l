'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { timesheetsApi, Timesheet, TimesheetPayload } from '@/lib/timesheets';
import TimesheetForm from '@/components/timesheets/TimesheetForm';

export default function TimesheetFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);

  const loadTimesheet = useCallback(async () => {
    try {
      setLoading(true);
      const data = await timesheetsApi.getById(params.id as string);
      setTimesheet(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheet.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!isNew) loadTimesheet();
  }, [isNew, loadTimesheet]);

  const handleSaveDraft = async (payload: TimesheetPayload) => {
    setError('');
    if (isNew) {
      await timesheetsApi.create(payload);
    } else {
      await timesheetsApi.update(params.id as string, payload);
    }
    router.push('/dashboard/candidate/timesheets');
  };

  const handleSubmitTimesheet = async (payload: TimesheetPayload) => {
    setError('');
    let currentId = params.id as string;
    if (isNew) {
      const created = await timesheetsApi.create(payload);
      currentId = created.id;
    } else {
      await timesheetsApi.update(currentId, payload);
    }
    await timesheetsApi.submit(currentId);
    router.push('/dashboard/candidate/timesheets');
  };

  const handleDownloadPdf = async () => {
    if (!timesheet) return;
    const { blob, filename } = await timesheetsApi.downloadPdf(timesheet.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = async () => {
    if (!timesheet) return;
    const { blob, filename } = await timesheetsApi.downloadExcel(timesheet.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareWithManager = async (payload: any) => {
    if (!timesheet) throw new Error("No timesheet loaded");
    return await timesheetsApi.shareWithManager(timesheet.id, payload);
  };

  const handleTimesheetUpdated = (updated: Timesheet) => {
    setTimesheet(updated);
    setSuccessMsg(`✅ Timesheet shared with ${updated.manager_name || updated.manager_email} successfully!`);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <TimesheetForm
      timesheet={timesheet}
      isNew={isNew}
      loading={loading}
      error={error}
      successMsg={successMsg}
      backLink="/dashboard/candidate/timesheets"
      onSaveDraft={handleSaveDraft}
      onSubmitTimesheet={handleSubmitTimesheet}
      onDownloadPdf={handleDownloadPdf}
      onDownloadExcel={handleDownloadExcel}
      onShareWithManager={handleShareWithManager}
      onTimesheetUpdated={handleTimesheetUpdated}
    />
  );
}
