import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['System Administrator']} redirectTo="/403">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Users Management</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Manage system users here.</p>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
