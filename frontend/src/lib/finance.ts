import { api } from './api';
import { Timesheet } from './timesheets';

export interface FinanceApprovePayload {
  hourly_rate?: number;
  tax_rate?: number;
  payment_terms?: string;
  notes?: string;
}

export interface FinanceRejectPayload {
  reason: string;
}

export const financeApi = {
  /** Finance queue: all client_approved timesheets */
  getPending: async (): Promise<Timesheet[]> => {
    return api.get<Timesheet[]>('/finance/pending');
  },

  /** Finance approves — triggers invoice generation. Returns generated Invoice. */
  approve: async (timesheetId: string, payload: FinanceApprovePayload): Promise<Invoice> => {
    return api.post<Invoice, FinanceApprovePayload>(`/finance/${timesheetId}/approve`, payload);
  },

  /** Finance rejects — returns timesheet to candidate */
  reject: async (timesheetId: string, reason: string): Promise<Timesheet> => {
    return api.post<Timesheet, FinanceRejectPayload>(`/finance/${timesheetId}/reject`, { reason });
  },
};

export interface Invoice {
  id: string;
  invoice_number: string;
  status: 'generated' | 'sent' | 'paid';
  timesheet_id: string;
  candidate_id: string;
  generated_by_id: string;
  period_start_date: string;
  period_end_date: string;
  total_hours: number;
  hourly_rate: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  work_summary: string;
  payment_terms: string;
  notes: string | null;
  issued_at: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}
