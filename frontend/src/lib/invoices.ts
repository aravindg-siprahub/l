import { api } from './api';
import { Invoice } from './finance';

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: 'generated' | 'sent' | 'paid';
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

export const invoicesApi = {
  /** Get all invoices */
  getAll: async (): Promise<InvoiceListItem[]> => {
    return api.get<InvoiceListItem[]>('/invoices/');
  },

  /** Get full invoice detail for the invoice template */
  getById: async (id: string): Promise<Invoice> => {
    return api.get<Invoice>(`/invoices/${id}`);
  },
};
