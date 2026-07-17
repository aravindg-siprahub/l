import { api } from './api';

export interface TimesheetEntry {
  id?: string;
  date: string; // YYYY-MM-DD
  hours_worked: number;
  task_description: string;
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
  created_at: string;
  updated_at: string;
  entries: TimesheetEntry[];
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
};
