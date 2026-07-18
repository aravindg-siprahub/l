'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

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
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <Link href="/" className={navItemClass('/')}>
          Dashboard
        </Link>
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
