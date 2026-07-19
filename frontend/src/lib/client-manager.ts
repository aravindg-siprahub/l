/**
 * Client Manager API client
 * ─────────────────────────
 * Dedicated module for all client-manager-scoped timesheet API calls.
 * Follows the same pattern as finance.ts — kept separate from timesheets.ts
 * (candidate-facing) to maintain clear role boundaries.
 */

import { api } from './api';
import { Timesheet, TimesheetEntry } from './timesheets';

// ── Response types ────────────────────────────────────────────────────────────

export interface PaginatedTimesheetResponse {
  items: Timesheet[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditLogEntry {
  id: string;
  timesheet_id: string;
  actor_id: string | null;
  action: 'submitted' | 'resubmitted' | 'shared' | 'client_approved' | 'client_rejected' | 'finance_approved' | 'finance_rejected';
  actor_role: string;
  actor_name: string | null;
  comments: string | null;
  version?: number;
  created_at: string;
}

export interface ClientManagerStats {
  pending: number;
  approved_this_month: number;
  rejected_this_month: number;
  avg_approval_time_hours: string;
  total_timesheets: number;
}

export interface TrendDataPoint {
  date: string;
  approved: number;
  shared: number;
  rejected: number;
}

export interface TrendDataOut {
  data: TrendDataPoint[];
}

export interface RecentActivityOut {
  id: string;
  action: string;
  actor_name: string | null;
  timesheet_id: string;
  period_start_date: string;
  period_end_date: string;
  total_hours: number;
  created_at: string;
  candidate_name: string | null;
}

// ── Query param types ─────────────────────────────────────────────────────────

export interface PendingQueueParams {
  page?: number;
  page_size?: number;
  search?: string;
  status_filter?: string;
  sort_by?: 'submitted_at' | 'period_start_date' | 'total_hours';
  sort_order?: 'asc' | 'desc';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ── API surface ───────────────────────────────────────────────────────────────

export const clientManagerApi = {
  /**
   * Paginated, searchable, filterable pending queue.
   * Defaults to page=1, page_size=20, status=submitted (pending only).
   * Pass status_filter="client_approved,client_rejected" for the history view.
   */
  getPending: async (params: PendingQueueParams = {}): Promise<PaginatedTimesheetResponse> => {
    const qs = buildQueryString({
      page: params.page,
      page_size: params.page_size,
      search: params.search,
      status_filter: params.status_filter,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    });
    return api.get<PaginatedTimesheetResponse>(`/timesheets/client-pending/${qs}`);
  },

  /**
   * Fetch a single timesheet for review using the manager-scoped endpoint.
   * This is the correct endpoint — it uses assignment-based auth, not candidate
   * ownership, and never returns 404 for the assigned manager.
   */
  getReview: async (id: string): Promise<Timesheet> => {
    return api.get<Timesheet>(`/timesheets/client-review/${id}`);
  },

  /** Live dashboard stats for the authenticated client manager. */
  getStats: async (): Promise<ClientManagerStats> => {
    return api.get<ClientManagerStats>('/timesheets/client-stats');
  },

  getTrendData: async (): Promise<TrendDataOut> => {
    return api.get<TrendDataOut>('/timesheets/client-trend');
  },

  getRecentActivity: async (): Promise<RecentActivityOut[]> => {
    return api.get<RecentActivityOut[]>('/timesheets/client-activity');
  },

  /** Audit log for a specific timesheet (assigned manager only). */
  getAuditLog: async (id: string): Promise<AuditLogEntry[]> => {
    return api.get<AuditLogEntry[]>(`/timesheets/${id}/audit`);
  },

  /**
   * Approve a timesheet with optional comments.
   * Returns the updated timesheet.
   */
  approve: async (id: string, comments?: string): Promise<Timesheet> => {
    return api.post<Timesheet, { comments?: string }>(
      `/timesheets/${id}/client-approve`,
      { comments: comments?.trim() || undefined }
    );
  },

  /**
   * Reject a timesheet with a required reason.
   * Returns the updated timesheet.
   */
  reject: async (id: string, reason: string): Promise<Timesheet> => {
    return api.post<Timesheet, { reason: string }>(
      `/timesheets/${id}/client-reject`,
      { reason: reason.trim() }
    );
  },
};
