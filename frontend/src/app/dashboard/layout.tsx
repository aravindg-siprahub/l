'use client';

import { useEffect, useState } from 'react';
import DashboardSidebar, { NavItem } from '@/components/dashboard/DashboardSidebar';
import { apiMe, UserOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  UserCircle, 
  UserSquare2, 
  CalendarDays, 
  BarChart3, 
  CheckCircle2, 
  Search, 
  FileText, 
  CreditCard,
  PlusCircle,
  Bell,
  ChevronDown
} from 'lucide-react';

const roleNavItems: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'Users', href: '/dashboard/admin/users', icon: <Users size={20} /> },
    { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: <ClipboardList size={20} /> },
    { label: 'Profile', href: '/dashboard/admin/profile', icon: <UserCircle size={20} /> },
  ],
  recruiter: [
    { label: 'Dashboard', href: '/dashboard/recruiter', icon: <LayoutDashboard size={20} /> },
    { label: 'Candidates', href: '/dashboard/recruiter/candidates', icon: <UserSquare2 size={20} /> },
    { label: 'Timesheets', href: '/dashboard/recruiter/timesheets', icon: <CalendarDays size={20} /> },
    { label: 'Reports', href: '/dashboard/recruiter/reports', icon: <BarChart3 size={20} /> },
    { label: 'Profile', href: '/dashboard/recruiter/profile', icon: <UserCircle size={20} /> },
  ],
  client_manager: [
    { label: 'Dashboard', href: '/dashboard/client-manager', icon: <LayoutDashboard size={20} /> },
    { label: 'Pending Approvals', href: '/dashboard/client-manager/timesheets', icon: <CheckCircle2 size={20} /> },
    { label: 'Approval History', href: '/dashboard/client-manager/history', icon: <ClipboardList size={20} /> },
    { label: 'Profile', href: '/dashboard/client-manager/profile', icon: <UserCircle size={20} /> },
  ],
  finance_team: [
    { label: 'Dashboard', href: '/dashboard/finance', icon: <LayoutDashboard size={20} /> },
    { label: 'Validation Queue', href: '/dashboard/finance/timesheets', icon: <Search size={20} /> },
    { label: 'Invoice Queue', href: '/dashboard/finance/invoices', icon: <FileText size={20} /> },
    { label: 'Billing Summary', href: '/dashboard/finance/billing', icon: <CreditCard size={20} /> },
    { label: 'Reports', href: '/dashboard/finance/reports', icon: <BarChart3 size={20} /> },
    { label: 'Profile', href: '/dashboard/finance/profile', icon: <UserCircle size={20} /> },
  ],
  candidate: [
    { label: 'Dashboard', href: '/dashboard/candidate', icon: <LayoutDashboard size={20} /> },
    { label: 'My Timesheets', href: '/dashboard/candidate/timesheets', icon: <CalendarDays size={20} /> },
    { label: 'Submit Timesheet', href: '/dashboard/candidate/timesheets/new', icon: <PlusCircle size={20} /> },
    { label: 'Profile', href: '/dashboard/candidate/profile', icon: <UserCircle size={20} /> },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
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
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900 font-sans">
      <DashboardSidebar 
        role={role} 
        userName={userName} 
        navItems={navItems} 
        collapsed={collapsed}
        onCollapseToggle={() => setCollapsed(!collapsed)}
      />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-56'}`}>
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-8 bg-zinc-50 dark:bg-zinc-900 border-none">
          <div className="flex-1"></div>
          
          {/* Global Search Mock */}
          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search timesheets, invoices..."
                className="block w-full pl-10 pr-12 py-2.5 border border-zinc-200/60 dark:border-zinc-800 rounded-full leading-5 bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-zinc-300 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs font-semibold text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5">⌘ K</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex justify-end items-center gap-4">
            <button className="relative p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-indigo-600 border-2 border-zinc-50 dark:border-zinc-900" />
            </button>
            
            <div className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-lg transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold text-sm shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:block">{userName}</span>
              <ChevronDown size={16} className="text-zinc-400" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {children}
          
          <footer className="mt-16 pt-8 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-4">
            <div>
              &copy; 2026 Lorvish Technologies. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Support</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
