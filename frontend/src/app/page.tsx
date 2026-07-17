import Sidebar from '@/components/marketing/Sidebar';
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
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 font-sans">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
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
    </div>
  );
}
