import { api } from './api';
import { Invoice } from './finance';

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: 'draft' | 'ready' | 'sent' | 'payment_pending' | 'paid';
  currency?: string;
  candidate_id: string;
  period_start_date: string;
  period_end_date: string;
  total_hours: number;
  hourly_rate: number;
  total_amount: number;
  issued_at: string;
  due_date: string;
  created_at: string;
}

export interface InvoiceUpdatePayload {
  client_name: string;
  billing_contact?: string;
  billing_address?: string;
  billing_email?: string;
  payment_terms: string;
  notes?: string;
}

export const invoicesApi = {
  /** Get all invoices */
  getAll: async (): Promise<InvoiceListItem[]> => {
    return api.get<InvoiceListItem[]>('/invoices/');
  },

  /** Get full invoice detail for the invoice template */
  getById: async (id: string): Promise<Invoice> => {
    return api.get<Invoice>(`/invoices/${id}`);
  },

  /** Update billing details for draft/ready invoice */
  updateBilling: async (id: string, payload: InvoiceUpdatePayload): Promise<Invoice> => {
    return api.put<Invoice, InvoiceUpdatePayload>(`/invoices/${id}`, payload);
  },

  /** Transition an invoice to a new state */
  transition: async (id: string, target_status: string, comments?: string): Promise<Invoice> => {
    return api.post<Invoice, { target_status: string, comments?: string }>(`/invoices/${id}/transition`, {
      target_status,
      comments
    });
  }
};
