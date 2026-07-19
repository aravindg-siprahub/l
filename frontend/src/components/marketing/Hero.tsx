"use client";

import { useEffect, useState } from "react";

const HERO_IMAGES = [
  { src: "/hero-image.png", transform: "scale(1.25) translateX(-8%)" },
  { src: "/hero-image-2.png", transform: "scale(1.2)" },
  { src: "/hero-image-3.png", transform: undefined },
];

export default function Hero() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveImage((i) => (i + 1) % HERO_IMAGES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative isolate pt-14 min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#c7d2fe] to-[#a5f3fc] opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="py-24 sm:py-32 w-full max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="mx-auto max-w-2xl lg:mx-0 text-center lg:text-left">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center lg:justify-start animate-fade-in-up">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-900/10 hover:ring-zinc-900/20 transition-all cursor-pointer bg-white/80">
                Announcing our new AI Invoice Generation.{' '}
                <a href="#features" className="font-semibold text-indigo-600">
                  <span className="absolute inset-0" aria-hidden="true"></span>Read more <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Automate Timesheets &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
                Invoice Generation
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              The AI-powered platform that simplifies operations for staffing and consulting businesses. Reduce manual work, improve billing accuracy, and maintain complete visibility across the approval lifecycle.
            </p>
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <a href="#contact" className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95">
                Get Started
              </a>
              <a href="/login" className="text-sm font-semibold leading-6 text-zinc-900 hover:text-indigo-600 transition-colors">
                Log in <span aria-hidden="true">→</span>
              </a>
              <a href="#contact" className="text-sm font-semibold leading-6 text-zinc-600 border-b border-transparent hover:border-zinc-400 transition-all">
                Request Demo
              </a>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden">
              {HERO_IMAGES.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.src}
                  src={img.src}
                  alt="Lorvish app on mobile"
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out"
                  style={{
                    opacity: i === activeImage ? 1 : 0,
                    transform: img.transform,
                  }}
                />
              ))}
            </div>

            <div className="absolute -top-4 -right-4 rounded-xl bg-white shadow-lg ring-1 ring-zinc-900/10 px-3 py-2 flex items-center gap-2 animate-float">
              <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs">✓</div>
              <span className="text-xs font-medium text-zinc-700">Invoice Sent</span>
            </div>

            <div className="absolute top-1/3 -left-6 rounded-xl bg-white shadow-lg ring-1 ring-zinc-900/10 px-3 py-2 flex items-center gap-2 animate-float" style={{ animationDelay: '500ms' }}>
              <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-xs">⏱</div>
              <span className="text-xs font-medium text-zinc-700">Timesheet Approved</span>
            </div>

            <div className="absolute -bottom-6 left-1/4 rounded-xl bg-white shadow-lg ring-1 ring-zinc-900/10 px-4 py-3 flex items-center gap-3 animate-float" style={{ animationDelay: '250ms' }}>
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm">🔒</div>
              <div>
                <p className="text-xs font-semibold text-zinc-900">Data Protection</p>
                <p className="text-[11px] text-zinc-500">Your data is well protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#c7d2fe] to-[#a5f3fc] opacity-40 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
    </div>
  );
}
