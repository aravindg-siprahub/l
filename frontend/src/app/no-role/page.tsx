'use client';

import { useAuth } from '@/providers/AuthProvider';
export default function NoRolePage() {
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-24">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold tracking-tight text-red-600">Access Denied</h2>
        <p className="text-gray-700">
          No role assigned to your account.
        </p>
        <p className="text-gray-500 text-sm">
          Please contact the System Administrator to have a role assigned.
        </p>
        <button
          onClick={signOut}
          className="w-full px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
