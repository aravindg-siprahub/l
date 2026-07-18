'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/admin';
import { UserOut } from '@/lib/auth';
import { Timesheet } from '@/lib/timesheets';
import TimesheetListTable from '@/components/timesheets/TimesheetListTable';

export default function AdminCandidateTimesheetsList() {
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<UserOut | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch both in parallel
      const [allCandidates, sheets] = await Promise.all([
        adminApi.getCandidates(),
        adminApi.getCandidateTimesheets(candidateId),
      ]);
      const found = allCandidates.find((c) => c.id === candidateId) ?? null;
      setCandidate(found);
      setTimesheets(sheets);
    } catch (err: any) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTimesheetUpdated = (updated: Timesheet) => {
    setTimesheets(prev => prev.map(ts => ts.id === updated.id ? updated : ts));
  };

  const handleDownloadPdf = async (id: string) => {
    const { blob, filename } = await adminApi.downloadPdf(id);
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
    const { blob, filename } = await adminApi.downloadExcel(id);
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
    <div className="space-y-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/dashboard/admin/candidates"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
        >
          ← Back to Candidates
        </Link>
        {candidate && (
          <>
            <span className="text-zinc-300">/</span>
            <span className="text-sm font-semibold text-zinc-900">{candidate.full_name}</span>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              {candidate.email}
            </span>
          </>
        )}
      </div>

      <TimesheetListTable
        timesheets={timesheets}
        loading={loading}
        error={error}
        onDownloadPdf={handleDownloadPdf}
        onDownloadExcel={handleDownloadExcel}
        onShareWithManager={(id, payload) => adminApi.shareWithManager(id, payload)}
        getViewUrl={(ts) => `/dashboard/admin/candidates/${candidateId}/timesheets/${ts.id}`}
        emptyStateLink=""
        emptyStateText=""
        canCreateNew={false}
        onTimesheetUpdated={handleTimesheetUpdated}
      />
    </div>
  );
}
