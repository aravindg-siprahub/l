'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiLogin } from '@/lib/auth';
import { saveTokens } from '@/lib/session';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

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

      <style>{`
        /* 3D Shapes floating animation */
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-20px) rotate(5deg) scale(1.02); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(25px) rotate(-5deg) scale(0.98); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(15deg) scale(1); }
          50% { transform: translateY(-15px) rotate(25deg) scale(1.05); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(30px) rotate(10deg) scale(0.95); }
        }
        
        /* Entire Card floating animation */
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .shape-1 { animation: float-1 8s ease-in-out infinite; }
        .shape-2 { animation: float-2 10s ease-in-out infinite; animation-delay: 1s; }
        .shape-3 { animation: float-3 12s ease-in-out infinite; animation-delay: 2s; }
        .shape-4 { animation: float-4 14s ease-in-out infinite; animation-delay: 0.5s; }
        .shape-5 { animation: float-2 9s ease-in-out infinite; animation-delay: 1.5s; }
        .shape-6 { animation: float-1 11s ease-in-out infinite; animation-delay: 3s; }
        
        .floating-card {
          animation: float-card 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .shape-1, .shape-2, .shape-3, .shape-4, .shape-5, .shape-6, .floating-card {
            animation: none !important;
            transform: none !important;
          }
        }
        
        /* Glass Input specific tweaks */
        .glass-input:focus {
          box-shadow: 0 0 0 3px rgba(77,124,240,0.25) !important;
          border-color: rgba(77,124,240,0.5) !important;
        }
        
        .glass-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .glass-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(79,70,229,0.5), 0 8px 10px -6px rgba(79,70,229,0.3) !important;
          background-color: #4338CA;
        }
      `}</style>

      {/* LEFT COLUMN - Visual Panel (hidden on <1024px) */}
      <div className="hidden lg:flex flex-col relative w-[55%] border-r border-[#E5E7EB] overflow-hidden bg-white">
        
        {/* Premium Enterprise SaaS Hero Illustration */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-illustration.png"
            alt="Lorvish AI Enterprise Timesheet & Invoice Management Platform"
            fill
            className="object-cover object-center"
            priority
          />
        </div>
      </div>

      {/* RIGHT COLUMN - Glassmorphism Form Card */}
      <div className="w-full lg:w-[45%] bg-[#FAFBFC] flex flex-col justify-center items-center p-6 xl:p-12 relative overflow-y-auto">

        {/* Logo Header (Above Form) */}
        <div className="flex flex-col items-center mb-8 mt-2 text-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Lorvish" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-[#111827] tracking-tight">Lorvish <span className="text-[#3B82F6]">AI</span></span>
          </div>
        </div>

        {/* Floating Glassmorphism Form Card */}
        <div className="floating-card relative z-10 w-full max-w-[460px] p-8 sm:p-10 rounded-[24px]" style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 24px 70px -12px rgba(80,90,220,0.22), inset 0 1px 0 rgba(255,255,255,0.5)'
        }}>

          <div className="text-center mb-8">
            <h2 className="text-[28px] font-bold text-[#111827] tracking-tight mb-2">Welcome Back</h2>
            <p className="text-[15px] text-[#4B5563] font-medium">Sign in to your Lorvish account</p>
          </div>

          {error && (
            <div className="mb-8 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-100 p-4 flex items-start gap-3">
              <div className="w-1 h-auto self-stretch bg-red-500 rounded-full"></div>
              <p className="text-sm font-medium text-red-800 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-[#6B7280]" />
              </div>
              <input
                id="email" name="email" type="email" required autoComplete="email"
                value={form.email} onChange={handleChange}
                className="glass-input block w-full h-[48px] rounded-xl border border-white/60 bg-white/40 pl-11 pr-4 text-[14px] text-[#111827] placeholder-[#4B5563] outline-none transition-all duration-200"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                placeholder="Email address"
                spellCheck="false"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-[#6B7280]" />
              </div>
              <input
                id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
                value={form.password} onChange={handleChange}
                className="glass-input block w-full h-[48px] rounded-xl border border-white/60 bg-white/40 pl-11 pr-12 text-[14px] text-[#111827] placeholder-[#4B5563] outline-none transition-all duration-200"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#6B7280] hover:text-[#374151] transition-colors duration-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit" disabled={loading}
              className="glass-btn relative flex items-center justify-center w-full h-[52px] rounded-xl bg-[#4F46E5] text-[15px] font-semibold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] disabled:opacity-60 disabled:cursor-not-allowed mt-2 overflow-hidden"
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
    </div>
  );
}
