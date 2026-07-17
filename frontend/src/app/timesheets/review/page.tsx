import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";

export default function TimesheetsReviewPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['Client Manager']} redirectTo="/403">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Timesheets Review</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Review and approve assigned timesheets here.</p>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
