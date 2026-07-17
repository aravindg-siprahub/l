'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleGuard } from './RoleGuard';
import { useAuth } from '@/providers/AuthProvider';

export function Navigation() {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();

  const navItemClass = (path: string) => 
    `block px-4 py-2 rounded-md transition-colors ${pathname === path ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`;

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="flex flex-col p-4 w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 min-h-screen">
      {/* Profile Section */}
      <div className="mb-8 px-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">Lorvish App</h2>
        
        <div className="flex flex-col space-y-1">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {displayName}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {user?.email}
          </span>
          {role && (
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full w-fit">
              {role}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <Link href="/" className={navItemClass('/')}>
          Dashboard
        </Link>

        {/* System Administrator Links */}
        <RoleGuard allowedRoles={['System Administrator']}>
          <Link href="/system/dashboard" className={navItemClass('/system/dashboard')}>Dashboard</Link>
          <Link href="/system/users" className={navItemClass('/system/users')}>Users</Link>
          <Link href="/system/roles" className={navItemClass('/system/roles')}>Roles</Link>
          <Link href="/system/workflows" className={navItemClass('/system/workflows')}>Workflows</Link>
          <Link href="/system/audit" className={navItemClass('/system/audit')}>Audit Logs</Link>
          <Link href="/system/settings" className={navItemClass('/system/settings')}>Settings</Link>
        </RoleGuard>

        {/* Candidate/Employee Links */}
        <RoleGuard allowedRoles={['Candidate/Employee']}>
          <Link href="/timesheets/my-timesheets" className={navItemClass('/timesheets/my-timesheets')}>My Timesheets</Link>
          <Link href="/timesheets/submit" className={navItemClass('/timesheets/submit')}>Submit Timesheet</Link>
          <Link href="/timesheets/status" className={navItemClass('/timesheets/status')}>Status</Link>
        </RoleGuard>

        {/* Client Manager Links */}
        <RoleGuard allowedRoles={['Client Manager']}>
          <Link href="/timesheets/approvals/pending" className={navItemClass('/timesheets/approvals/pending')}>Pending Approvals</Link>
          <Link href="/timesheets/approvals/approved" className={navItemClass('/timesheets/approvals/approved')}>Approved</Link>
          <Link href="/timesheets/approvals/rejected" className={navItemClass('/timesheets/approvals/rejected')}>Rejected</Link>
        </RoleGuard>

        {/* HR Team Links */}
        <RoleGuard allowedRoles={['HR Team']}>
          <Link href="/hr/validation/queue" className={navItemClass('/hr/validation/queue')}>Validation Queue</Link>
          <Link href="/hr/validation/employee" className={navItemClass('/hr/validation/employee')}>Employee Validation</Link>
          <Link href="/hr/history" className={navItemClass('/hr/history')}>History</Link>
        </RoleGuard>

        {/* Accounts Team Links */}
        <RoleGuard allowedRoles={['Accounts Team']}>
          <Link href="/invoices/queue" className={navItemClass('/invoices/queue')}>Invoice Queue</Link>
          <Link href="/invoices/ai-generated" className={navItemClass('/invoices/ai-generated')}>AI Generated Invoices</Link>
          <Link href="/invoices/billing-validation" className={navItemClass('/invoices/billing-validation')}>Billing Validation</Link>
          <Link href="/invoices/sent" className={navItemClass('/invoices/sent')}>Sent Invoices</Link>
        </RoleGuard>

        {/* Client Links */}
        <RoleGuard allowedRoles={['Client']}>
          <Link href="/invoices/my-invoices" className={navItemClass('/invoices/my-invoices')}>My Invoices</Link>
          <Link href="/invoices/status" className={navItemClass('/invoices/status')}>Invoice Status</Link>
        </RoleGuard>
      </div>

      {/* Logout Section */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={signOut}
          className="w-full text-left px-4 py-2 rounded-md font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}
