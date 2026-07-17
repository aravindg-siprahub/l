'use client';
import { useState } from 'react';

const inputClass = "block w-full rounded-md border-0 px-3.5 py-2 text-zinc-900 bg-white shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
const labelClass = "block text-sm font-semibold leading-6 text-zinc-900";

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', company_name: '', phone: '', subject: '', message: '' });
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
      setFormData({ name: '', email: '', company_name: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div id="contact" className="relative isolate bg-zinc-50 py-24 sm:py-32 overflow-hidden border-t border-zinc-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Contact sales</h2>
          <p className="mt-2 text-lg leading-8 text-zinc-600">Learn how Lorvish can transform your timesheet and invoice workflow.</p>
        </div>
        <div className="mx-auto mt-16 max-w-xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
            <div>
              <label htmlFor="name" className={labelClass}>Full name *</label>
              <div className="mt-2"><input required type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email *</label>
              <div className="mt-2"><input required type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div>
              <label htmlFor="company_name" className={labelClass}>Company</label>
              <div className="mt-2"><input type="text" name="company_name" id="company_name" value={formData.company_name} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone number</label>
              <div className="mt-2"><input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="subject" className={labelClass}>Subject</label>
              <div className="mt-2"><input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className={labelClass}>Message *</label>
              <div className="mt-2"><textarea required name="message" id="message" rows={4} value={formData.message} onChange={handleChange} className={inputClass}></textarea></div>
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
                className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                {status === 'loading' ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
