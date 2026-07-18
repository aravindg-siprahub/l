/**
 * TimesheetStatusBadge
 * Reusable badge component that maps a timesheet status string to a
 * human-readable label and a semantic colour. Never hardcodes text inline.
 */

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  draft: {
    label: 'Draft',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-300',
  },
  submitted: {
    label: 'Pending Review',
    className: 'bg-amber-50 text-amber-700 ring-amber-300',
  },
  client_approved: {
    label: 'Client Approved',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
  },
  client_rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 ring-red-300',
  },
  finance_approved: {
    label: 'Finance Approved',
    className: 'bg-teal-50 text-teal-700 ring-teal-300',
  },
  finance_rejected: {
    label: 'Finance Rejected',
    className: 'bg-rose-50 text-rose-700 ring-rose-300',
  },
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export default function TimesheetStatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-300',
  };
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset ${sizeClass} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
