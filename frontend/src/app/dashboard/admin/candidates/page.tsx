import { redirect } from 'next/navigation';

export default function AdminCandidatesPage() {
  redirect('/dashboard/admin/users?filter=candidate');
}
