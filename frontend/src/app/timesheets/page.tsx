import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";

export default function TimesheetsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['Candidate/Employee', 'Client Manager']} redirectTo="/403">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Timesheets</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome to the Timesheets dashboard. Here you can submit or review timesheets.
          </p>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
