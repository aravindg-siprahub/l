import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";

export default function SystemPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['System Administrator']} redirectTo="/403">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">System Configuration</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome to the System Administration dashboard. Here you can manage users, roles, workflows, and view audit logs.
          </p>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
