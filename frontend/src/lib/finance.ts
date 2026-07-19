import { api } from './api';
import { Timesheet } from './timesheets';

export interface FinanceApprovePayload {
  hourly_rate?: number;
  tax_rate?: number;
  payment_terms?: string;
  notes?: string;
  client_name: string;
  billing_contact?: string;
  billing_address?: string;
  billing_email?: string;
}

export interface FinanceRejectPayload {
  reason: string;
}

export interface DashboardStats {
  pending_validation: number;
  draft_invoices: number;
  ready_invoices: number;
  sent_invoices: number;
  paid_invoices: number;
  total_revenue: number;
  total_outstanding: number;
}

export interface FinanceTrendDataPoint {
  date: string;
  draft: number;
  sent: number;
  paid: number;
}

export const financeApi = {
  /** Finance queue: all client_approved timesheets */
  getPending: async (): Promise<Timesheet[]> => {
    return api.get<Timesheet[]>('/finance/pending');
  },

  /** Get a specific timesheet for finance review */
  getTimesheetById: async (timesheetId: string): Promise<Timesheet> => {
    return api.get<Timesheet>(`/finance/timesheets/${timesheetId}`);
  },

  /** Finance approves — triggers invoice generation. Returns generated Invoice. */
  approve: async (timesheetId: string, payload: FinanceApprovePayload): Promise<Invoice> => {
    return api.post<Invoice, FinanceApprovePayload>(`/finance/${timesheetId}/approve`, payload);
  },

  /** Finance rejects — returns timesheet to candidate */
  reject: async (timesheetId: string, reason: string): Promise<Timesheet> => {
    return api.post<Timesheet, FinanceRejectPayload>(`/finance/${timesheetId}/reject`, { reason });
  },

  /** Fetch dashboard stats */
  getDashboardStats: async (): Promise<DashboardStats> => {
    return api.get<DashboardStats>('/finance/dashboard/stats');
  },

  /** Fetch trend data for invoices */
  getTrendData: async (): Promise<{ data: FinanceTrendDataPoint[] }> => {
    return api.get<{ data: FinanceTrendDataPoint[] }>('/finance/dashboard/trend');
  },
};

export interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'ready' | 'sent' | 'payment_pending' | 'paid';
  currency?: string;
  template_name?: string;
  snapshot_data?: any;
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
