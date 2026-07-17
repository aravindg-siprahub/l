import DashboardSidebar, { NavItem } from '@/components/dashboard/DashboardSidebar';

const roleNavItems: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: '🏠' },
    { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
    { label: 'Candidates', href: '/dashboard/admin/candidates', icon: '🧑‍💼' },
    { label: 'Timesheets', href: '/dashboard/admin/timesheets', icon: '🗓️' },
    { label: 'Finance', href: '/dashboard/admin/finance', icon: '💰' },
    { label: 'Invoices', href: '/dashboard/admin/invoices', icon: '📄' },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: '📊' },
    { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: '📋' },
  ],
  recruiter: [
    { label: 'Dashboard', href: '/dashboard/recruiter', icon: '🏠' },
    { label: 'Candidates', href: '/dashboard/recruiter/candidates', icon: '🧑‍💼' },
    { label: 'Timesheets', href: '/dashboard/recruiter/timesheets', icon: '🗓️' },
    { label: 'Reports', href: '/dashboard/recruiter/reports', icon: '📊' },
  ],
  client_manager: [
    { label: 'Dashboard', href: '/dashboard/client-manager', icon: '🏠' },
    { label: 'Pending Approvals', href: '/dashboard/client-manager/timesheets', icon: '✅' },
    { label: 'Approval History', href: '/dashboard/client-manager/history', icon: '📋' },
  ],
  finance_team: [
    { label: 'Dashboard', href: '/dashboard/finance', icon: '🏠' },
    { label: 'Validation Queue', href: '/dashboard/finance/timesheets', icon: '🔍' },
    { label: 'Invoice Queue', href: '/dashboard/finance/invoices', icon: '📄' },
    { label: 'Billing Summary', href: '/dashboard/finance/billing', icon: '💰' },
    { label: 'Reports', href: '/dashboard/finance/reports', icon: '📊' },
  ],
  candidate: [
    { label: 'Dashboard', href: '/dashboard/candidate', icon: '🏠' },
    { label: 'My Timesheets', href: '/dashboard/candidate/timesheets', icon: '🗓️' },
    { label: 'Submit Timesheet', href: '/dashboard/candidate/timesheets/new', icon: '➕' },
    { label: 'Profile', href: '/dashboard/candidate/profile', icon: '👤' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const role = 'admin';
  const userName = 'Platform User';
  const navItems = roleNavItems[role] ?? roleNavItems.admin;

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      <DashboardSidebar role={role} userName={userName} navItems={navItems} />
      <div className="flex-1 ml-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-white border-b border-zinc-200 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Lorvish Platform</h1>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
              <span className="text-xl" aria-label="Notifications">🔔</span>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
