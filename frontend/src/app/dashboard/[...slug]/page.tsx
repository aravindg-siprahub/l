import Link from 'next/link';

export default async function ComingSoonPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.slug?.join('/') || '';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-6">🚧</div>
      <h2 className="text-2xl font-bold text-zinc-900 mb-2">Coming Soon</h2>
      <p className="text-zinc-500 mb-6 max-w-md">
        The <span className="font-semibold text-indigo-600">/{path}</span> module is currently under development. 
        It will be available in a future release.
      </p>
      <Link 
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
