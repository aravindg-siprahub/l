'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  role: string;
  userName: string;
  navItems: NavItem[];
  collapsed: boolean;
  onCollapseToggle: () => void;
}

export default function DashboardSidebar({ role, userName, navItems, collapsed, onCollapseToggle }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`print:hidden sticky top-0 h-screen shrink-0 z-40 flex flex-col bg-white border-r border-zinc-200 shadow-sm transition-all duration-300 dark:bg-zinc-950 dark:border-zinc-800 ${
        collapsed ? 'w-20' : 'w-52'
      }`}
    >
      {/* Logo */}
      <div className={`flex h-16 shrink-0 items-center border-b border-zinc-100 dark:border-zinc-800 px-4 ${collapsed ? 'justify-center' : 'justify-start'}`}>
        <Link href="/dashboard" className="flex items-center gap-3">
          {collapsed ? (
            <img src="/lorvish-logo.png" alt="Lorvish Logo" className="h-8 w-auto object-contain shrink-0" />
          ) : (
            <img src="/lorvish-logo.png" alt="Lorvish Logo" className="h-11 w-auto object-contain" />
          )}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => {
          // Find the most specific active item
          const isExactMatch = pathname === item.href;
          const isParentMatch = pathname.startsWith(item.href + '/');
          
          // It's active if it's an exact match. 
          // Or if it's a parent match AND there isn't a more specific exact match in the navItems
          let isActive = false;
          if (isExactMatch) {
            isActive = true;
          } else if (isParentMatch) {
            // Check if there is any OTHER nav item that is a BETTER match (longer href)
            const betterMatch = navItems.find(other => 
              other.href !== item.href && 
              (pathname === other.href || (pathname.startsWith(other.href + '/') && other.href.length > item.href.length))
            );
            if (!betterMatch) {
              isActive = true;
            }
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 pb-8 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
        <button
          onClick={onCollapseToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} className="shrink-0" />
          ) : (
            <>
              <PanelLeftClose size={18} className="shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
