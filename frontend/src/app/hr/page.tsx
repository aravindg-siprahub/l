import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";

export default function HRPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['HR Team']} redirectTo="/403">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">HR Hub</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome to the HR Hub. Here you can view attendance, allocations, and contracts.
          </p>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
