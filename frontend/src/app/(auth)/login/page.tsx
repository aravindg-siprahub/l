'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiLogin } from '@/lib/auth';
import { saveTokens } from '@/lib/session';
import { Eye, EyeOff, Mail, Lock, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex min-h-screen w-full bg-[#F3F6F9] font-sans antialiased items-center justify-center p-4 sm:p-8">
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateZ(0deg); }
          50% { transform: translateY(-15px) rotateZ(1deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; filter: blur(10px); transform: scale(1); }
          50% { opacity: 1; filter: blur(20px); transform: scale(1.1); }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes dash-reverse {
          to { stroke-dashoffset: 20; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-pulse-fast { animation: pulse-fast 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-dash { animation: dash 1s linear infinite; }
        .animate-dash-reverse { animation: dash-reverse 1s linear infinite; }
      `}</style>
      
      <div className="w-full max-w-[1200px] h-[90vh] max-h-[760px] min-h-[600px] bg-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] flex overflow-hidden border border-white">
        
        {/* Left Panel - Premium 3D AI Workflow */}
        <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-gradient-to-br from-[#EAF2FF] via-[#F4F8FF] to-[#FFFFFF] items-center justify-center [perspective:2000px]">
          {/* Soft Background Swirls/Waves */}
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-gradient-to-br from-[#A7C8FF]/30 to-transparent rounded-[100%] blur-[80px] -rotate-45 animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[90%] h-[70%] bg-gradient-to-tl from-[#D0E2FF]/40 to-transparent rounded-[100%] blur-[90px] rotate-12"></div>
          
          {/* Floating Glass Bubbles */}
          <div className="absolute top-[15%] left-[15%] w-16 h-16 rounded-full bg-gradient-to-br from-white/80 to-white/10 backdrop-blur-md shadow-[inset_0_4px_10px_rgba(255,255,255,0.8),_0_10px_20px_rgba(59,130,246,0.15)] animate-float-slow"></div>
          <div className="absolute bottom-[20%] right-[10%] w-10 h-10 rounded-full bg-gradient-to-br from-white/90 to-white/20 backdrop-blur-md shadow-[inset_0_2px_5px_rgba(255,255,255,0.9),_0_8px_15px_rgba(59,130,246,0.2)] animate-float-slower"></div>
          <div className="absolute top-[35%] right-[25%] w-6 h-6 rounded-full bg-gradient-to-br from-white/90 to-white/20 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.9)] animate-float-slow"></div>

          {/* Central 3D Composition */}
          <div className="relative w-full h-[600px] flex items-center justify-center [transform-style:preserve-3d]">
              
              {/* Pedestal Base */}
              <div className="absolute bottom-[10%] w-[420px] h-[120px] [transform:rotateX(75deg)] [transform-style:preserve-3d]">
                 {/* Bottom ring */}
                 <div className="absolute inset-0 rounded-[100%] border-[6px] border-[#A7C8FF]/30 shadow-[0_30px_60px_rgba(59,130,246,0.25)]"></div>
                 {/* Top surface */}
                 <div className="absolute inset-[-10px] rounded-[100%] bg-gradient-to-b from-white/80 to-white/30 backdrop-blur-xl border border-white shadow-[inset_0_0_20px_rgba(255,255,255,0.9)] [transform:translateZ(30px)] flex items-center justify-center">
                    <div className="w-[85%] h-[85%] rounded-[100%] border border-[#93C5FD]/40 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]"></div>
                 </div>
              </div>

              {/* Glowing Connection Paths (Spline representation) */}
              <svg className="absolute w-[600px] h-[400px] top-[20%] left-1/2 -translate-x-1/2 pointer-events-none z-10 opacity-70" viewBox="0 0 600 400">
                 <path d="M 150 200 C 250 250, 300 200, 300 200" fill="none" stroke="url(#glow-grad)" strokeWidth="2" strokeDasharray="4 8" className="animate-dash" />
                 <path d="M 300 200 C 350 150, 420 250, 450 220" fill="none" stroke="url(#glow-grad)" strokeWidth="2" strokeDasharray="4 8" className="animate-dash-reverse" />
                 <defs>
                   <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                     <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                     <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                   </linearGradient>
                 </defs>
                 {/* Glowing nodes */}
                 <circle cx="150" cy="200" r="4" fill="#FFFFFF" className="animate-pulse-fast" />
                 <circle cx="300" cy="200" r="6" fill="#FFFFFF" className="animate-pulse-fast" />
                 <circle cx="450" cy="220" r="4" fill="#FFFFFF" className="animate-pulse-fast" />
              </svg>

              {/* Left: Floating Document Layer */}
              <div className="absolute left-[15%] top-[15%] w-[180px] h-[240px] bg-white/70 backdrop-blur-2xl rounded-2xl border border-white shadow-[0_20px_40px_rgba(59,130,246,0.12)] p-5 [transform:rotateY(15deg)_rotateZ(-5deg)] animate-float-slow z-20">
                 {/* Skeleton UI inside Document */}
                 <div className="w-12 h-12 bg-[#EFF6FF] rounded-lg mb-4 flex items-center justify-center border border-[#BFDBFE]">
                    <div className="w-6 h-6 bg-[#60A5FA] rounded-sm opacity-50"></div>
                 </div>
                 <div className="w-full h-3 bg-[#E5E7EB] rounded-full mb-3"></div>
                 <div className="w-3/4 h-3 bg-[#E5E7EB] rounded-full mb-6"></div>
                 {/* Grid */}
                 <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="h-4 bg-[#BFDBFE] rounded-sm col-span-1"></div>
                    <div className="h-4 bg-[#F3F4F6] rounded-sm col-span-2"></div>
                 </div>
                 <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="h-4 bg-[#BFDBFE] rounded-sm col-span-1"></div>
                    <div className="h-4 bg-[#F3F4F6] rounded-sm col-span-2"></div>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="h-4 bg-[#BFDBFE] rounded-sm col-span-1"></div>
                    <div className="h-4 bg-[#F3F4F6] rounded-sm col-span-2"></div>
                 </div>
              </div>

              {/* Secondary Document underneath */}
              <div className="absolute left-[22%] top-[10%] w-[180px] h-[240px] bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_10px_30px_rgba(59,130,246,0.05)] p-5 [transform:translateZ(-40px)_rotateY(15deg)_rotateZ(-2deg)] animate-float-slower z-10">
                 <div className="w-full h-4 bg-[#E5E7EB] rounded-full mb-4"></div>
                 <div className="w-5/6 h-4 bg-[#F3F4F6] rounded-full mb-4"></div>
                 <div className="w-4/6 h-4 bg-[#F3F4F6] rounded-full"></div>
              </div>

              {/* Center: AI Core Chip */}
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 animate-float">
                 {/* Outer octagon/hexagon glow */}
                 <div className="w-[140px] h-[140px] bg-gradient-to-br from-[#60A5FA]/30 to-[#2563EB]/10 rounded-[30px] backdrop-blur-xl border-2 border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.3)] flex items-center justify-center [transform:rotateZ(45deg)]">
                    {/* Inner chip */}
                    <div className="w-[80px] h-[80px] bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-2xl shadow-[inset_0_2px_10px_rgba(255,255,255,0.5),_0_10px_20px_rgba(29,78,216,0.4)] flex items-center justify-center border border-[#93C5FD]">
                       <div className="w-[36px] h-[36px] bg-white rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.9)] animate-pulse-glow"></div>
                    </div>
                    {/* Circuit traces (CSS) */}
                    <div className="absolute top-2 left-1/2 w-1 h-4 bg-white/60 rounded-full"></div>
                    <div className="absolute bottom-2 left-1/2 w-1 h-4 bg-white/60 rounded-full"></div>
                    <div className="absolute left-2 top-1/2 w-4 h-1 bg-white/60 rounded-full"></div>
                    <div className="absolute right-2 top-1/2 w-4 h-1 bg-white/60 rounded-full"></div>
                 </div>
              </div>

              {/* Right: Glass Folder & Validation */}
              <div className="absolute right-[15%] top-[45%] w-[180px] h-[160px] z-20 [transform:rotateY(-15deg)_rotateZ(5deg)] animate-float-slow" style={{ animationDelay: '1s' }}>
                 {/* Back of folder */}
                 <div className="absolute bottom-0 w-full h-[120px] bg-gradient-to-tr from-[#60A5FA] to-[#3B82F6] rounded-xl shadow-lg"></div>
                 {/* Folder tab */}
                 <div className="absolute bottom-[110px] left-0 w-1/3 h-[20px] bg-[#60A5FA] rounded-t-lg"></div>
                 
                 {/* Document sliding into folder */}
                 <div className="absolute bottom-[40px] left-[15%] w-[70%] h-[140px] bg-white rounded-xl shadow-md p-4 [transform:translateZ(10px)_rotateZ(2deg)]">
                    <div className="w-full h-3 bg-[#E5E7EB] rounded-full mb-3"></div>
                    <div className="w-5/6 h-3 bg-[#E5E7EB] rounded-full mb-3"></div>
                    <div className="w-4/6 h-3 bg-[#E5E7EB] rounded-full mb-6"></div>
                    <div className="flex gap-2">
                       <div className="w-8 h-8 rounded bg-[#EFF6FF] border border-[#BFDBFE]"></div>
                       <div className="w-8 h-8 rounded bg-[#EFF6FF] border border-[#BFDBFE]"></div>
                    </div>
                 </div>

                 {/* Front of folder (Glass) */}
                 <div className="absolute bottom-0 w-full h-[100px] bg-gradient-to-tr from-white/60 to-white/20 backdrop-blur-2xl rounded-xl border border-white/80 shadow-[0_10px_30px_rgba(59,130,246,0.2)] [transform:translateZ(20px)_rotateX(15deg)] origin-bottom">
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                       <Check size={14} className="text-[#3B82F6]" />
                    </div>
                 </div>
              </div>

              {/* Floating Glass Chart Widget */}
              <div className="absolute right-[10%] top-[20%] w-[120px] h-[120px] bg-white/50 backdrop-blur-xl rounded-2xl border border-white/80 shadow-[0_15px_35px_rgba(59,130,246,0.1)] p-3 [transform:rotateY(-20deg)_translateZ(-20px)] animate-float-slower z-10 flex items-end gap-2 justify-center pb-4">
                 <div className="w-4 h-[40%] bg-gradient-to-t from-[#60A5FA] to-[#93C5FD] rounded-sm"></div>
                 <div className="w-4 h-[70%] bg-gradient-to-t from-[#3B82F6] to-[#60A5FA] rounded-sm"></div>
                 <div className="w-4 h-[90%] bg-gradient-to-t from-[#2563EB] to-[#3B82F6] rounded-sm"></div>
              </div>

          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center items-center p-6 sm:p-12 xl:p-16 relative overflow-y-auto">
          <div className="w-full max-w-[360px] my-auto">
            
            {/* Logo */}
            <div className="mb-12 flex justify-center">
              <img src="/logo.png" alt="Lorvish" className="h-10 w-auto" />
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-50/50 border border-red-100 p-4">
                <p className="text-[14px] font-medium text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Mail size={18} className="text-[#9CA3AF]" />
                </div>
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  value={form.email} onChange={handleChange}
                  className="block w-full h-[48px] rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-[14px] text-[#111827] placeholder-[#9CA3AF] shadow-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none transition-all duration-200"
                  placeholder="Email address"
                  spellCheck="false"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Lock size={18} className="text-[#9CA3AF]" />
                </div>
                <input
                  id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
                  value={form.password} onChange={handleChange}
                  className="block w-full h-[48px] rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-12 text-[14px] text-[#111827] placeholder-[#9CA3AF] shadow-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none transition-all duration-200"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#9CA3AF] hover:text-[#4B5563] transition-colors duration-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="submit" disabled={loading}
                  className="relative flex items-center justify-center w-full h-[48px] rounded-xl bg-[#3B5EFC] hover:bg-[#2F4AD1] text-[15px] font-medium text-white shadow-[0_4px_14px_0_rgba(59,94,252,0.39)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5EFC] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
