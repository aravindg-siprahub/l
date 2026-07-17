import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";

export default function MyTimesheetsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['Candidate/Employee']} redirectTo="/403">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">My Timesheets</h1>
          <p className="text-zinc-600 dark:text-zinc-400">View and submit your timesheets here.</p>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
