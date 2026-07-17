import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['Accounts Team', 'Client']} redirectTo="/403">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Invoices</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome to the Invoices dashboard. Here you can generate, review, and approve invoices.
          </p>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
