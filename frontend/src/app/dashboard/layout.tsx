'use client';

import { useEffect, useState } from 'react';
import DashboardSidebar, { NavItem } from '@/components/dashboard/DashboardSidebar';
import { apiMe, UserOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const roleNavItems: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: '🏠' },
    { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
    { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: '📋' },
    { label: 'Profile', href: '/dashboard/admin/profile', icon: '👤' },
  ],
  recruiter: [
    { label: 'Dashboard', href: '/dashboard/recruiter', icon: '🏠' },
    { label: 'Candidates', href: '/dashboard/recruiter/candidates', icon: '🧑‍💼' },
    { label: 'Timesheets', href: '/dashboard/recruiter/timesheets', icon: '🗓️' },
    { label: 'Reports', href: '/dashboard/recruiter/reports', icon: '📊' },
    { label: 'Profile', href: '/dashboard/recruiter/profile', icon: '👤' },
  ],
  client_manager: [
    { label: 'Dashboard', href: '/dashboard/client-manager', icon: '🏠' },
    { label: 'Pending Approvals', href: '/dashboard/client-manager/timesheets', icon: '✅' },
    { label: 'Approval History', href: '/dashboard/client-manager/history', icon: '📋' },
    { label: 'Profile', href: '/dashboard/client-manager/profile', icon: '👤' },
  ],
  finance_team: [
    { label: 'Dashboard', href: '/dashboard/finance', icon: '🏠' },
    { label: 'Validation Queue', href: '/dashboard/finance/timesheets', icon: '🔍' },
    { label: 'Invoice Queue', href: '/dashboard/finance/invoices', icon: '📄' },
    { label: 'Billing Summary', href: '/dashboard/finance/billing', icon: '💰' },
    { label: 'Reports', href: '/dashboard/finance/reports', icon: '📊' },
    { label: 'Profile', href: '/dashboard/finance/profile', icon: '👤' },
  ],
  candidate: [
    { label: 'Dashboard', href: '/dashboard/candidate', icon: '🏠' },
    { label: 'My Timesheets', href: '/dashboard/candidate/timesheets', icon: '🗓️' },
    { label: 'Submit Timesheet', href: '/dashboard/candidate/timesheets/new', icon: '➕' },
    { label: 'Profile', href: '/dashboard/candidate/profile', icon: '👤' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token') || '';
        const u = await apiMe(token);
        setUser(u);
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center text-zinc-500">
          <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = user.role;
  const userName = user.full_name;
  const navItems = roleNavItems[role] ?? [];

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
