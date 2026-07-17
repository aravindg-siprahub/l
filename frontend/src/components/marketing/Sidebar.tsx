import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex-col hidden md:flex shadow-sm">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl">L</div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">Lorvish</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col px-6 py-4 space-y-8 overflow-y-auto">
        <div>
          <div className="text-xs font-semibold leading-6 text-zinc-400 uppercase tracking-wider mb-2">Explore</div>
          <ul role="list" className="-mx-2 space-y-1">
            {[
              { href: '#features', label: 'Features' },
              { href: '#workflow', label: 'How it Works' },
              { href: '#benefits', label: 'Platform Benefits' },
              { href: '#faq', label: 'FAQ' },
              { href: '#contact', label: 'Contact' },
            ].map(item => (
              <li key={item.href}>
                <Link href={item.href} className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-zinc-700 hover:text-indigo-600 hover:bg-zinc-50 transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="mt-auto p-6 flex flex-col gap-3">
        <Link href="/login" className="flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors">
          Log in
        </Link>
        <Link href="#contact" className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors">
          Get Started
        </Link>
      </div>
    </aside>
  );
}
