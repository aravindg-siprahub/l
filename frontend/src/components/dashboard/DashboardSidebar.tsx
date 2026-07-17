'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clearTokens } from '@/lib/session';
import { apiLogout } from '@/lib/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface DashboardSidebarProps {
  role: string;
  userName: string;
  navItems: NavItem[];
}

export default function DashboardSidebar({ role, userName, navItems }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout error', err);
    }
    clearTokens();
    window.location.href = '/login';
  };

  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    recruiter: 'Recruiter',
    client_manager: 'Client Manager',
    finance_team: 'Finance Team',
    candidate: 'Candidate',
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-zinc-200 shadow-sm transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-zinc-200">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl">L</div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Lorvish</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl mx-auto">L</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-zinc-400 hover:text-zinc-600 transition-colors ${collapsed ? 'mx-auto mt-1' : ''}`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* User badge */}
      {!collapsed && (
        <div className="mx-3 my-3 rounded-xl bg-zinc-50 border border-zinc-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{userName}</p>
              <p className="text-xs text-zinc-500 truncate">{roleLabel[role] ?? role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-zinc-200">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Log out' : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <span className="text-lg shrink-0">🚪</span>
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
