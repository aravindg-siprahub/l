'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRole, hasRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, fallback = null, redirectTo }: RoleGuardProps) {
  const { isLoading } = useAuth();
  const role = useRole();
  const router = useRouter();
  
  const authorized = hasRole(role, allowedRoles);

  useEffect(() => {
    if (!isLoading && !authorized && redirectTo) {
      router.push(redirectTo);
    }
  }, [isLoading, authorized, redirectTo, router]);

  if (isLoading) {
    return null; // Return null while loading, or you could return a skeleton
  }

  if (!authorized) {
    if (redirectTo) {
      return null; // Render nothing while redirecting
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
