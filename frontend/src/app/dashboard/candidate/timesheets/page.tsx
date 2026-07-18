'use client';

import { useEffect, useState, useCallback } from 'react';
import { Timesheet, timesheetsApi } from '@/lib/timesheets';
import TimesheetListTable from '@/components/timesheets/TimesheetListTable';

export default function CandidateTimesheetsList() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTimesheets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await timesheetsApi.getAll();
      setTimesheets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timesheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTimesheets(); }, [loadTimesheets]);

  const handleTimesheetUpdated = (updated: Timesheet) => {
    setTimesheets(prev => prev.map(ts => ts.id === updated.id ? updated : ts));
  };

  const handleDownloadPdf = async (id: string) => {
    const { blob, filename } = await timesheetsApi.downloadPdf(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = async (id: string) => {
    const { blob, filename } = await timesheetsApi.downloadExcel(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <TimesheetListTable
      timesheets={timesheets}
      loading={loading}
      error={error}
      onDownloadPdf={handleDownloadPdf}
      onDownloadExcel={handleDownloadExcel}
      onShareWithManager={(id, payload) => timesheetsApi.shareWithManager(id, payload)}
      getViewUrl={(ts) => `/dashboard/candidate/timesheets/${ts.id}`}
      emptyStateLink="/dashboard/candidate/timesheets/new"
      emptyStateText="Create your first timesheet"
      canCreateNew={true}
      onTimesheetUpdated={handleTimesheetUpdated}
    />
  );
}
