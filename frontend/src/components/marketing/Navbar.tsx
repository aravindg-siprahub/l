'use client';

import { useEffect, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/80 backdrop-blur transition-shadow duration-300 ${
        scrolled ? 'border-zinc-200 shadow-sm' : 'border-transparent shadow-none'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Lorvish" className="h-9 w-auto" />

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
          >
            Log in
          </a>
          <a
            href="/register"
            className="rounded-md border border-indigo-600 px-5 py-2 text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-50 hover:scale-105 active:scale-95"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
