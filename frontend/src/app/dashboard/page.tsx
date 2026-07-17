import { redirect } from 'next/navigation';

/**
 * Default /dashboard — redirects to the role-specific dashboard.
 * In production this reads the JWT from cookies to determine the role.
 * For now it defaults to admin.
 */
export default function DashboardRoot() {
  redirect('/dashboard/admin');
}
