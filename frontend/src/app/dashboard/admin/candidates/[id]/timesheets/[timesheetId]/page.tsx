'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin';
import { Timesheet, TimesheetPayload } from '@/lib/timesheets';
import TimesheetForm from '@/components/timesheets/TimesheetForm';

export default function AdminTimesheetFormPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;
  const timesheetId = params.timesheetId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);

  const loadTimesheet = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTimesheetById(timesheetId);
      setTimesheet(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheet.');
    } finally {
      setLoading(false);
    }
  }, [timesheetId]);

  useEffect(() => {
    loadTimesheet();
  }, [loadTimesheet]);

  // Admins are viewing existing timesheets, they should probably be able to update/submit if needed
  // For now we map to the admin endpoints
  const handleSaveDraft = async (payload: TimesheetPayload) => {
    setError('');
    await adminApi.updateTimesheet(timesheetId, payload);
    router.push(`/dashboard/admin/candidates/${candidateId}/timesheets`);
  };

  const handleSubmitTimesheet = async (payload: TimesheetPayload) => {
    setError('');
    await adminApi.updateTimesheet(timesheetId, payload);
    await adminApi.submitTimesheet(timesheetId);
    router.push(`/dashboard/admin/candidates/${candidateId}/timesheets`);
  };

  const handleDownloadPdf = async () => {
    if (!timesheet) return;
    const { blob, filename } = await adminApi.downloadPdf(timesheet.id);
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
    const { blob, filename } = await adminApi.downloadExcel(timesheet.id);
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
    return await adminApi.shareWithManager(timesheet.id, payload);
  };

  const handleTimesheetUpdated = (updated: Timesheet) => {
    setTimesheet(updated);
    setSuccessMsg(`✅ Timesheet shared with ${updated.manager_name || updated.manager_email} successfully!`);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <TimesheetForm
      timesheet={timesheet}
      isNew={false}
      loading={loading}
      error={error}
      successMsg={successMsg}
      backLink={`/dashboard/admin/candidates/${candidateId}/timesheets`}
      onSaveDraft={handleSaveDraft}
      onSubmitTimesheet={handleSubmitTimesheet}
      onDownloadPdf={handleDownloadPdf}
      onDownloadExcel={handleDownloadExcel}
      onShareWithManager={handleShareWithManager}
      onTimesheetUpdated={handleTimesheetUpdated}
    />
  );
}
