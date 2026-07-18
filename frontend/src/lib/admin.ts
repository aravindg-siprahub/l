import { api } from './api';
import { Timesheet, SharePayload, TimesheetPayload } from './timesheets';
import { UserOut } from './auth';

export const adminApi = {
  // Users
  getUsers: async (): Promise<UserOut[]> => {
    return api.get<UserOut[]>('/admin/users');
  },
  createUser: async (payload: any): Promise<UserOut> => {
    return api.post<UserOut, any>('/admin/users', payload);
  },
  updateUser: async (userId: string, payload: any): Promise<UserOut> => {
    return api.put<UserOut, any>(`/admin/users/${userId}`, payload);
  },

  // Candidates
  getCandidates: async (): Promise<UserOut[]> => {
    return api.get<UserOut[]>('/admin/candidates');
  },

  // Candidate Timesheets
  getCandidateTimesheets: async (candidateId: string): Promise<Timesheet[]> => {
    return api.get<Timesheet[]>(`/admin/candidates/${candidateId}/timesheets`);
  },

  getTimesheetById: async (timesheetId: string): Promise<Timesheet> => {
    return api.get<Timesheet>(`/admin/timesheets/${timesheetId}`);
  },

  updateTimesheet: async (timesheetId: string, payload: TimesheetPayload): Promise<Timesheet> => {
    return api.put<Timesheet, TimesheetPayload>(`/admin/timesheets/${timesheetId}`, payload);
  },

  submitTimesheet: async (timesheetId: string): Promise<Timesheet> => {
    return api.post<Timesheet, Record<string, never>>(`/admin/timesheets/${timesheetId}/submit`, {});
  },

  shareWithManager: async (timesheetId: string, payload: SharePayload): Promise<Timesheet> => {
    return api.post<Timesheet, SharePayload>(`/admin/timesheets/${timesheetId}/share`, payload);
  },

  downloadPdf: async (timesheetId: string): Promise<{ blob: Blob; filename: string }> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'}/admin/timesheets/${timesheetId}/pdf`,
      {
        method: 'GET',
        credentials: 'include', // Backend uses HttpOnly cookies — never localStorage
      }
    );

    if (response.status === 401) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Download failed.' }));
      throw new Error(err.detail ?? 'Failed to download PDF.');
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename="([^"]+)"/.exec(disposition);
    const filename = match ? match[1] : `timesheet_${timesheetId}.pdf`;

    return { blob, filename };
  },

  downloadExcel: async (timesheetId: string): Promise<{ blob: Blob; filename: string }> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'}/admin/timesheets/${timesheetId}/excel`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (response.status === 401) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Download failed.' }));
      throw new Error(err.detail ?? 'Failed to download Excel file.');
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename="([^"]+)"/.exec(disposition);
    const filename = match ? match[1] : `timesheet_${timesheetId}.xlsx`;

    return { blob, filename };
  },
};
