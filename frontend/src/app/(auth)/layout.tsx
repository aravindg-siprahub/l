export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xl shadow-sm">
              L
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900">Lorvish</span>
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
