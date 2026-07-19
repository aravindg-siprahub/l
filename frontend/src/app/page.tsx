import Navbar from '@/components/marketing/Navbar';
import Hero from '@/components/marketing/Hero';
import Features from '@/components/marketing/Features';
import Workflow from '@/components/marketing/Workflow';
import PlatformBenefits from '@/components/marketing/PlatformBenefits';
import FAQ from '@/components/marketing/FAQ';
import Contact from '@/components/marketing/Contact';
import Footer from '@/components/marketing/Footer';

export const metadata = {
  title: 'Lorvish | AI-Powered Timesheet & Invoice Management',
  description: 'Automate your staffing operations with Lorvish. Transform timesheet approvals and invoice generation into a seamless, error-free workflow.',
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-pink-50/50 to-cyan-50/60 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 font-sans">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Workflow />
        <PlatformBenefits />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
