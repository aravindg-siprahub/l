'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiLogin } from '@/lib/auth';
import { saveTokens } from '@/lib/session';
import { Eye, EyeOff, CheckCircle2, Hexagon, Layers, Zap, Lock } from 'lucide-react';

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
      {/* Left Panel - 55% */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] bg-[#FAFBFC] border-r border-[#E5E7EB] p-12 xl:p-20 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#4F46E5]/5 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-[#6366F1]/5 blur-3xl -translate-y-1/2"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="Lorvish" className="h-10 w-auto" />
          <span className="text-xl font-bold text-[#111827] tracking-tight">Lorvish Platform</span>
        </div>

        <div className="relative z-10 max-w-2xl mt-12 xl:mt-16">
          <h1 className="text-4xl xl:text-5xl font-bold text-[#111827] leading-[1.15] tracking-tight mb-6">
            AI-Powered Timesheet &<br />Invoice Management
          </h1>
          <p className="text-lg text-[#6B7280] mb-10 leading-relaxed max-w-xl font-medium">
            Manage workforce operations from timesheet submission to invoice generation through one intelligent enterprise platform.
          </p>

          <div className="space-y-4 mb-12">
            {[
              "Smart Timesheet Submission",
              "Multi-Level Approval Workflow",
              "AI Invoice Generation",
              "HR & Finance Validation",
              "Secure Audit Trail"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-[#111827] font-medium">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981]">
                  <CheckCircle2 size={16} className="text-[#10B981]" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Abstract SVG Illustration */}
          <div className="relative w-full max-w-lg h-72 xl:h-80 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 overflow-hidden flex items-center justify-center mt-4">
             <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[#F8F9FF]"></div>
             
             {/* Dashboard / Analytics Abstract Representation */}
             <div className="relative z-10 w-full h-full flex flex-col gap-4">
                {/* Header Mock */}
                <div className="flex items-center justify-between w-full pb-4 border-b border-[#E5E7EB]/50">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center">
                        <Layers size={20} className="text-[#4F46E5]" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="w-24 h-2.5 bg-[#111827] rounded-full"></div>
                        <div className="w-16 h-2 bg-[#6B7280]/50 rounded-full"></div>
                      </div>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-[#4F46E5]/10 flex items-center justify-center">
                     <Zap size={14} className="text-[#4F46E5]" />
                   </div>
                </div>

                {/* Content Mock */}
                <div className="flex gap-4 h-full">
                   {/* Left Column (Chart) */}
                   <div className="w-2/3 h-full flex flex-col gap-3">
                      <div className="flex items-end gap-3 h-28 p-4 bg-white rounded-xl border border-[#E5E7EB]/50 shadow-sm relative overflow-hidden">
                         <div className="absolute top-3 left-4 text-[10px] font-bold text-[#6B7280]">AI Analysis</div>
                         <div className="w-full flex items-end gap-2 h-full pt-6">
                           <div className="flex-1 bg-gradient-to-t from-[#4F46E5]/20 to-[#4F46E5]/5 h-[40%] rounded-t-sm"></div>
                           <div className="flex-1 bg-gradient-to-t from-[#4F46E5]/40 to-[#4F46E5]/10 h-[60%] rounded-t-sm"></div>
                           <div className="flex-1 bg-gradient-to-t from-[#4F46E5]/60 to-[#4F46E5]/20 h-[80%] rounded-t-sm relative">
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#4F46E5]"></div>
                           </div>
                           <div className="flex-1 bg-gradient-to-t from-[#4F46E5] to-[#6366F1] h-[100%] rounded-t-sm relative shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">98%</div>
                           </div>
                           <div className="flex-1 bg-gradient-to-t from-[#6366F1]/80 to-[#6366F1]/20 h-[70%] rounded-t-sm"></div>
                           <div className="flex-1 bg-gradient-to-t from-[#2563EB]/40 to-[#2563EB]/10 h-[50%] rounded-t-sm"></div>
                         </div>
                      </div>
                      <div className="flex gap-3 h-full">
                         <div className="flex-1 bg-white rounded-xl border border-[#E5E7EB]/50 flex items-center justify-center shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#10B981]/5"></div>
                            <div className="flex flex-col items-center gap-1">
                               <CheckCircle2 size={20} className="text-[#10B981]" />
                               <div className="w-10 h-1.5 bg-[#10B981]/40 rounded-full mt-1"></div>
                            </div>
                         </div>
                         <div className="flex-1 bg-white rounded-xl border border-[#E5E7EB]/50 flex items-center justify-center shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#4F46E5]/5"></div>
                            <div className="flex flex-col items-center gap-1">
                               <Hexagon size={20} className="text-[#4F46E5]" />
                               <div className="w-10 h-1.5 bg-[#4F46E5]/40 rounded-full mt-1"></div>
                            </div>
                         </div>
                      </div>
                   </div>
                   {/* Right Column (List) */}
                   <div className="w-1/3 h-full bg-white rounded-xl border border-[#E5E7EB]/50 shadow-sm p-3 flex flex-col gap-2.5">
                      <div className="text-[10px] font-bold text-[#6B7280] mb-1">Recent Activity</div>
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="w-full rounded-lg bg-[#F8F9FF] border border-[#E5E7EB]/40 flex items-center p-2 gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-[#10B981]' : i === 1 ? 'bg-[#4F46E5]' : 'bg-[#F59E0B]'}`}></div>
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="w-full h-1.5 rounded bg-[#D1D5DB]"></div>
                            <div className="w-2/3 h-1.5 rounded bg-[#E5E7EB]"></div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-auto w-full h-8 rounded-lg bg-[#4F46E5]/5 border border-[#4F46E5]/10 flex items-center justify-center">
                         <div className="w-12 h-1.5 rounded-full bg-[#4F46E5]/40"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-semibold text-[#6B7280]">
          <span className="flex items-center gap-1.5"><Lock size={14} className="text-[#6B7280]" /> Secure</span>
          <span className="w-1 h-1 rounded-full bg-[#D1D5DB]"></span>
          <span>Automated</span>
          <span className="w-1 h-1 rounded-full bg-[#D1D5DB]"></span>
          <span>Enterprise Ready</span>
        </div>
      </div>

      {/* Right Panel - 45% */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center items-center p-6 xl:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[460px] xl:max-w-[500px] my-auto py-10">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <img src="/logo.png" alt="Lorvish" className="h-9 w-auto" />
            <span className="text-xl font-bold text-[#111827] tracking-tight">Lorvish Platform</span>
          </div>

          <div className="mb-10">
            <h2 className="text-[32px] font-bold text-[#111827] tracking-tight mb-3">Welcome Back</h2>
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
              className="relative flex items-center justify-center w-full h-[52px] rounded-xl bg-[#4F46E5] text-[15px] font-semibold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-[#4338CA] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden"
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
