import Link from 'next/link';

export default function AccessDenied() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="p-10 bg-white dark:bg-zinc-900 shadow-lg rounded-xl border border-zinc-200 dark:border-zinc-800 text-center max-w-md">
        <h1 className="text-5xl font-bold text-red-600 dark:text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Access Denied</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          You do not have permission to view this page. If you believe this is a mistake, please contact your System Administrator.
        </p>
        <Link 
          href="/" 
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
