import { api } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export interface TimesheetEntry {
  id?: string;
  date: string; // YYYY-MM-DD
  hours_worked: number;
  task_description: string;
  version?: number; // submission version this entry belongs to
}

export interface Timesheet {
  id: string;
  candidate_id: string;
  period_start_date: string;
  period_end_date: string;
  status: 'draft' | 'submitted' | 'client_approved' | 'client_rejected' | 'finance_approved' | 'finance_rejected';
  total_hours: number;
  notes: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_by_id?: string | null;
  reviewed_at?: string | null;
  approval_comments?: string | null;
  current_version?: number; // latest submission version number
  // Phase 1 sharing fields — null means not yet shared
  manager_email: string | null;
  manager_name: string | null;
  shared_at: string | null;  // ISO datetime; non-null = timesheet has been shared
  created_at: string;
  updated_at: string;
  entries: TimesheetEntry[];
  // Enriched candidate info (populated on manager-scoped endpoints)
  candidate_name?: string | null;
  candidate_email?: string | null;
}

export interface TimesheetPayload {
  period_start_date: string;
  period_end_date: string;
  notes?: string;
  entries: {
    date: string;
    hours_worked: number;
    task_description: string;
  }[];
}

export interface SharePayload {
  manager_email: string;
  manager_name?: string;
}

/**
 * Derive timesheet type from the period dates.
 * Single source of truth on the frontend — used by list page, detail page, and PDF.
 * Rule: period ≤ 8 days → Weekly, otherwise → Monthly.
 */
export function getTimesheetType(startDate: string, endDate: string): 'Weekly' | 'Monthly' {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const days  = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days <= 8 ? 'Weekly' : 'Monthly';
}

export const timesheetsApi = {
  /** Get all timesheets for current candidate */
  getAll: async (): Promise<Timesheet[]> => {
    return api.get<Timesheet[]>('/timesheets/');
  },

  /** Get a single timesheet by ID */
  getById: async (id: string): Promise<Timesheet> => {
    return api.get<Timesheet>(`/timesheets/${id}`);
  },

  /** Create a new draft timesheet */
  create: async (payload: TimesheetPayload): Promise<Timesheet> => {
    return api.post<Timesheet, TimesheetPayload>('/timesheets/', payload);
  },

  /** Update an existing draft/rejected timesheet */
  update: async (id: string, payload: TimesheetPayload): Promise<Timesheet> => {
    return api.put<Timesheet, TimesheetPayload>(`/timesheets/${id}`, payload);
  },

  /** Submit a timesheet for approval */
  submit: async (id: string): Promise<Timesheet> => {
    return api.post<Timesheet, Record<string, never>>(`/timesheets/${id}/submit`, {});
  },

  // --- Client Manager Routes ---

  /** Get all timesheets pending client approval */
  getClientPending: async (): Promise<Timesheet[]> => {
    return api.get<Timesheet[]>('/timesheets/client-pending/');
  },

  /** Client Manager approves a timesheet */
  clientApprove: async (id: string, comments?: string): Promise<Timesheet> => {
    return api.post<Timesheet, { comments?: string }>(`/timesheets/${id}/client-approve`, { comments });
  },

  /** Client Manager rejects a timesheet */
  clientReject: async (id: string, reason: string): Promise<Timesheet> => {
    return api.post<Timesheet, { reason: string }>(`/timesheets/${id}/client-reject`, { reason });
  },

  // --- Phase 1: Candidate → Manager Sharing ---

  /**
   * Share a submitted timesheet with a manager via email (PDF attached).
   * The backend validates email via Pydantic EmailStr before sending.
   * DB is only updated after successful email delivery.
   */
  shareWithManager: async (id: string, payload: SharePayload): Promise<Timesheet> => {
    return api.post<Timesheet, SharePayload>(`/timesheets/${id}/share`, payload);
  },

  /**
   * Download a timesheet as a PDF.
   * Returns { blob, filename } for browser-side download trigger.
   * Uses fetch directly (not api.get) to handle binary blob response.
   */
  downloadPdf: async (id: string): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`${API_BASE}/timesheets/${id}/pdf`, {
      method: 'GET',
      credentials: 'include',
    });

    if (res.status === 401) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Download failed.' }));
      throw new Error(err.detail ?? 'Failed to download PDF.');
    }

    // Extract filename from Content-Disposition header
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `timesheet_${id}.pdf`;

    const blob = await res.blob();
    return { blob, filename };
  },

  /**
   * Download a timesheet as an Excel file.
   * Returns { blob, filename } for browser-side download trigger.
   */
  downloadExcel: async (id: string): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`${API_BASE}/timesheets/${id}/excel`, {
      method: 'GET',
      credentials: 'include',
    });

    if (res.status === 401) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Download failed.' }));
      throw new Error(err.detail ?? 'Failed to download Excel file.');
    }

    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `timesheet_${id}.xlsx`;

    const blob = await res.blob();
    return { blob, filename };
  },
};
