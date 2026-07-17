'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRegister } from '@/lib/auth';

const ROLE_OPTIONS = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'client_manager', label: 'Client Manager' },
  { value: 'finance_team', label: 'Finance Team' },
  { value: 'admin', label: 'Admin' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'candidate' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRegister(form.full_name, form.email, form.password, form.role);
      router.push('/login?registered=1');
    } catch (err: any) {
      setError(err.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-zinc-200 shadow-lg p-8">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Create an account</h1>
      <p className="text-sm text-zinc-500 mb-8">Get started with Lorvish today</p>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 mb-1.5">Full name</label>
          <input id="full_name" name="full_name" type="text" required value={form.full_name} onChange={handleChange}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
            placeholder="Jane Smith" />
        </div>
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-zinc-700 mb-1.5">Email address</label>
          <input id="reg-email" name="email" type="email" required value={form.email} onChange={handleChange}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
            placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
          <input id="reg-password" name="password" type="password" required minLength={8} value={form.password} onChange={handleChange}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
            placeholder="Min. 8 characters" />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-zinc-700 mb-1.5">Role</label>
          <select id="role" name="role" value={form.role} onChange={handleChange}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition">
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">Sign in</a>
      </p>
    </div>
  );
}
