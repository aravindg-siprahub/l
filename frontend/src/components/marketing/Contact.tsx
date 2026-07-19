'use client';
import { useState } from 'react';

const inputClass = "block w-full rounded-md border-0 px-3.5 py-2.5 text-zinc-900 bg-white shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 placeholder:uppercase placeholder:text-xs placeholder:tracking-wide focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";

const LOCATIONS = [
  {
    title: 'US Headquarters',
    address: '4819 Emperor Boulevard, Suite 400, Durham, NC 27703',
    phone: '+1 919-999-0626',
    email: 'info@lorvish.com',
    mapQuery: '4819 Emperor Boulevard, Suite 400, Durham, NC 27703',
  },
  {
    title: 'Regional Office',
    address: '499 Ernston Rd, Parlin, NJ 08859',
    mapQuery: '499 Ernston Rd, Parlin, NJ 08859',
  },
  {
    title: 'India Headquarters',
    address: '#502, Techno Residency, Near Paradise Hotel, Raheja Mindspace Building, Madhapur, Hyderabad - 500081',
    mapQuery: 'Techno Residency, Raheja Mindspace, Madhapur, Hyderabad 500081',
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">{children}</h3>
      <div className="relative mt-2 h-px w-16 bg-zinc-900">
        <span className="absolute -right-[3px] -top-[3px] h-2 w-2 rounded-full border-2 border-indigo-500 bg-white" />
      </div>
    </div>
  );
}

function IconBadge({ tone, children }: { tone: 'navy' | 'amber'; children: React.ReactNode }) {
  const toneClass = tone === 'navy' ? 'bg-slate-700 text-white' : 'bg-amber-400 text-white';
  return (
    <div className={`flex h-14 w-14 items-center justify-center rounded-full shadow-sm ${toneClass}`}>
      {children}
    </div>
  );
}

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await fetch('http://localhost:8000/api/v1/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit form');
      }
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };

  return (
    <div id="contact" className="relative isolate py-24 sm:py-32 overflow-hidden border-t border-zinc-200/70">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Contact sales</h2>
          <p className="mt-2 text-lg leading-8 text-zinc-600">Learn how Lorvish can transform your timesheet and invoice workflow.</p>
        </div>

        {/* Headquarters */}
        <div className="mt-16 grid grid-cols-1 gap-12 sm:mt-20 sm:grid-cols-3">
          {LOCATIONS.map((loc) => (
            <div key={loc.title}>
              <SectionHeading>{loc.title}</SectionHeading>
              <p className="text-sm leading-6 text-zinc-600">{loc.address}</p>
              {loc.phone && (
                <p className="mt-3 text-sm text-zinc-600">
                  Tel:{' '}
                  <a href={`tel:${loc.phone.replace(/[^+\d]/g, '')}`} className="hover:text-indigo-600">
                    {loc.phone}
                  </a>
                </p>
              )}
              {loc.email && (
                <p className="text-sm text-zinc-600">
                  <a href={`mailto:${loc.email}`} className="hover:text-indigo-600">{loc.email}</a>
                </p>
              )}
              {loc.mapQuery && (
                <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
                  <iframe
                    title={`${loc.title} map`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(loc.mapQuery)}&z=13&output=embed`}
                    className="h-48 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Get a quote */}
        <div className="mt-20 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading>Get a Quote</SectionHeading>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <div>
                <label htmlFor="name" className="sr-only">Name</label>
                <input required type="text" name="name" id="name" placeholder="Name" value={formData.name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone" className="sr-only">Mobile</label>
                <input type="tel" name="phone" id="phone" placeholder="Mobile" value={formData.phone} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input required type="email" name="email" id="email" placeholder="Email id" value={formData.email} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="subject" className="sr-only">Subject</label>
                <input type="text" name="subject" id="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="message" className="sr-only">Messages</label>
                <textarea required name="message" id="message" rows={4} placeholder="Messages" value={formData.message} onChange={handleChange} className={inputClass}></textarea>
              </div>

              <div className="sm:col-span-2">
                {status === 'success' && (
                  <div className="mb-4 rounded-md bg-green-50 p-4 border border-green-200">
                    <p className="text-sm font-medium text-green-800">Message sent successfully! We will contact you soon.</p>
                  </div>
                )}
                {status === 'error' && (
                  <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                  </div>
                )}
                <button type="submit" disabled={status === 'loading'}
                  className="rounded-md bg-zinc-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                  {status === 'loading' ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>

          <div className="hidden lg:flex h-full items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-6 pt-10">
              <IconBadge tone="amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <circle cx="12" cy="8" r="3.2" /><path d="M5 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5" />
                </svg>
              </IconBadge>
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-amber-400">
                <path d="M2 6h20v12H2z" opacity=".15" /><path d="M2 6l10 7L22 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-6">
              <IconBadge tone="navy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  <path d="M12 2a5 5 0 00-5 5v3a5 5 0 0010 0V7a5 5 0 00-5-5z" />
                  <path d="M4 10h1a7 7 0 0014 0h1" />
                  <path d="M12 17v4M9 21h6" />
                </svg>
              </IconBadge>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-700 text-white shadow-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9c0-.6.4-1 1-1H8c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 pt-16">
              <IconBadge tone="amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
                </svg>
              </IconBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
