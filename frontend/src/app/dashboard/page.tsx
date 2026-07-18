import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Default /dashboard — redirects to the role-specific dashboard based on JWT token.
 */
export default async function DashboardRoot() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
      
      const role = payload.role;
      if (role === 'admin') return redirect('/dashboard/admin');
      if (role === 'client_manager') return redirect('/dashboard/client-manager');
      if (role === 'finance_team') return redirect('/dashboard/finance');
      if (role === 'candidate') return redirect('/dashboard/candidate');
      if (role === 'recruiter') return redirect('/dashboard/recruiter');
    } catch (e) {
      // Token parsing failed, fallback to login
    }
  }
  
  redirect('/login');
}
