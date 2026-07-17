import { useAuth } from '@/providers/AuthProvider';

export function useRole() {
  const { role } = useAuth();
  return role;
}

export function hasRole(currentRole: string | null, allowedRoles: string[]) {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole);
}
