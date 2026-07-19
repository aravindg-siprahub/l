export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-pink-50/50 to-cyan-50/60 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 flex items-center justify-center px-4">
      <a href="/" className="absolute top-6 left-6 inline-flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Lorvish" className="h-9 w-auto" />
      </a>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
