'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
        const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
        const role = payload.role;
        
        if (role === 'admin') router.push('/dashboard/admin');
        else if (role === 'client_manager') router.push('/dashboard/client-manager');
        else if (role === 'finance_team') router.push('/dashboard/finance');
        else if (role === 'candidate') router.push('/dashboard/candidate');
        else if (role === 'recruiter') router.push('/dashboard/recruiter');
        else router.push('/dashboard');
      } catch (e) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full bg-[#FAFBFC] font-sans antialiased overflow-hidden">
      <div className="absolute top-6 left-6 z-20">
        <img src="/logo-lorvish.png" alt="Lorvish" className="h-10 w-auto" />
      </div>

      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center items-center p-6 xl:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[460px] xl:max-w-[500px] my-auto py-10">

          <div className="mb-10">
            <h2 className="text-[40px] font-bold text-[#111827] tracking-tight mb-3">Welcome Back</h2>
            <p className="text-[16px] text-[#6B7280] font-medium">Sign in to your Lorvish account</p>
          </div>

          {error && (
            <div className="mb-8 rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
              <div className="w-1 h-auto self-stretch bg-red-500 rounded-full"></div>
              <p className="text-sm font-medium text-red-800 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#111827] mb-2.5">Email address</label>
              <input
                id="email" name="email" type="email" required autoComplete="email"
                value={form.email} onChange={handleChange}
                className="block w-full h-[52px] rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] text-[#111827] placeholder-[#6B7280] shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 outline-none transition-all duration-200"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#111827] mb-2.5">Password</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
                  value={form.password} onChange={handleChange}
                  className="block w-full h-[52px] rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 pr-12 text-[15px] text-[#111827] placeholder-[#6B7280] shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#6B7280] hover:text-[#111827] transition-colors duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="relative flex items-center justify-center w-full h-[52px] rounded-xl bg-gradient-to-r from-[#465CDE] to-[#8B5CF6] text-[15px] font-semibold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:opacity-90 hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Right Panel - Illustration */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#EDEFFB] items-center justify-center" style={{ perspective: '1400px' }}>
        <div className="animate-float relative w-full h-full">
          <div
            className="relative w-full h-full"
            style={{ transform: 'rotateY(-8deg) rotateX(4deg) scale(0.92)', transformStyle: 'preserve-3d' }}
          >
            <Image
              src="/login-illustration.png"
              alt="Lorvish invoice management"
              fill
              className="object-cover rounded-2xl shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
