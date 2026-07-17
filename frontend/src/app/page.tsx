'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from '@/providers/AuthProvider';

export default function Home() {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!role) {
      router.push('/no-role');
      return;
    }

    switch (role) {
      case 'System Administrator':
        router.push('/system/dashboard');
        break;
      case 'HR Team':
        router.push('/hr');
        break;
      case 'Accounts Team':
      case 'Client':
        router.push('/invoices');
        break;
      case 'Candidate/Employee':
      case 'Client Manager':
        router.push('/timesheets');
        break;
      default:
        router.push('/no-role');
    }
  }, [role, isLoading, router]);

  return (
    <ProtectedRoute>
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
