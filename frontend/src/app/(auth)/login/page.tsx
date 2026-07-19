'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiLogin } from '@/lib/auth';
import { saveTokens } from '@/lib/session';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const tokens = await apiLogin(form.email, form.password);
      saveTokens();
      
      try {
        // Fast-path redirect based on JWT role to avoid slow double-hops
        const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
        const role = payload.role;
        
        if (role === 'admin') router.push('/dashboard/admin');
        else if (role === 'client_manager') router.push('/dashboard/client-manager');
        else if (role === 'finance_team') router.push('/dashboard/finance');
        else if (role === 'candidate') router.push('/dashboard/candidate');
        else if (role === 'recruiter') router.push('/dashboard/recruiter');
        else router.push('/dashboard');
      } catch (e) {
        // Fallback if parsing fails
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-zinc-200 shadow-lg p-8">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Welcome back</h1>
      <p className="text-sm text-zinc-500 mb-8">Sign in to your Lorvish account</p>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">Email address</label>
          <input
            id="email" name="email" type="email" required autoComplete="email"
            value={form.email} onChange={handleChange}
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
              value={form.password} onChange={handleChange}
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

    </div>
  );
}
