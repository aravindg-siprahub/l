'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200/70">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 sm:py-16 lg:px-8">
        <div className="flex justify-center flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Lorvish" className="h-9 w-auto" />
          </div>
          <p className="text-center text-sm leading-5 text-zinc-500">
            Enterprise AI-Powered Timesheet & Invoice Management Platform.
          </p>
        </div>
        <div className="mt-8 flex justify-center space-x-10">
          <Link href="#features" className="text-sm text-zinc-500 hover:text-zinc-900 hover:text-zinc-700">Features</Link>
          <Link href="#workflow" className="text-sm text-zinc-500 hover:text-zinc-900 hover:text-zinc-700">Workflow</Link>
          <Link href="#benefits" className="text-sm text-zinc-500 hover:text-zinc-900 hover:text-zinc-700">Benefits</Link>
          <Link href="#contact" className="text-sm text-zinc-500 hover:text-zinc-900 hover:text-zinc-700">Contact</Link>
          <Link href="/status" className="text-sm text-zinc-500 hover:text-zinc-900 hover:text-zinc-700">System Status</Link>
        </div>
      </div>

      <div className="relative bg-black px-6 py-5 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-center text-sm text-zinc-300 sm:text-left">
            <Link href="/support" className="text-indigo-400 hover:text-indigo-300">Support</Link>
            {' '}/{' '}
            <Link href="/terms" className="text-indigo-400 hover:text-indigo-300">Terms &amp; Conditions</Link>
            {' '}/{' '}
            <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link>
            {' '}/{' '}
            &copy; {new Date().getFullYear()}{' '}
            <span className="text-indigo-400">Lorvish Technologies.</span> All Rights Reserved.
          </p>
          <p className="text-sm text-zinc-300">
            Designed By <span className="text-indigo-400">Fleet IT Solutions Pvt Ltd.</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className="absolute -top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg ring-1 ring-white/10 transition-colors hover:bg-zinc-800 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </footer>
  );
}
