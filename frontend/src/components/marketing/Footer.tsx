import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 sm:py-16 lg:px-8">
        <div className="flex justify-center flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xl">L</div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">Lorvish Technologies</span>
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
        <p className="mt-8 text-center text-xs leading-5 text-zinc-500">
          &copy; {new Date().getFullYear()} Lorvish Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
