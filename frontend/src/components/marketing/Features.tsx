import Image from 'next/image';
import Reveal from './Reveal';

const features = [
  {
    name: 'AI Timesheet Management',
    description: 'Automate candidate submissions, validate hours effortlessly, and track status with intelligent validation rules that prevent common errors.',
    icon: '/features/timesheet.png',
    accent: 'bg-indigo-500'
  },
  {
    name: 'Client Approval Workflow',
    description: 'Seamlessly send approval requests via Microsoft Graph API. Clients can approve, reject, or add comments with a single click.',
    icon: '/features/approval.png',
    accent: 'bg-emerald-500'
  },
  {
    name: 'Finance Validation',
    description: 'HR and Accounts teams verify employee allocation, attendance, and billable hours through an optimized queue before invoicing.',
    icon: '/features/finance.png',
    accent: 'bg-blue-500'
  },
  {
    name: 'AI Invoice Generation',
    description: 'Our AI engine automatically calculates billing amounts, computes taxes, generates the invoice PDF, and drafts the delivery email.',
    icon: '/features/invoice-gen.png',
    accent: 'bg-violet-500'
  },
  {
    name: 'Invoice Tracking',
    description: 'Complete visibility into invoice status. Know exactly when an invoice is generated, sent, viewed, and paid by the client.',
    icon: '/features/tracking.png',
    accent: 'bg-teal-500'
  },
  {
    name: 'Audit Logs',
    description: 'Maintain compliance with a complete audit history of all actions, approvals, edits, and system activities across all modules.',
    icon: '/features/audit.png',
    accent: 'bg-amber-500'
  },
  {
    name: 'Analytics Dashboard',
    description: 'Role-specific dashboards providing actionable insights, pending tasks, recent activity, and workflow statistics at a glance.',
    icon: '/features/analytics.png',
    accent: 'bg-sky-500'
  },
  {
    name: 'Role-Based Access Control',
    description: 'Secure, granular permissions ensuring Candidates, Client Managers, HR, Finance, and Admins only see what they need to.',
    icon: '/features/rbac.png',
    accent: 'bg-purple-500'
  }
];

export default function Features() {
  return (
    <div id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            A complete platform for modern staffing
          </p>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            From the moment a candidate submits a timesheet to the second the invoice is delivered, Lorvish handles the heavy lifting so your team can focus on growth.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4 md:grid-cols-2">
            {features.map((feature, i) => (
              <Reveal key={feature.name} delay={(i % 4) * 80}>
                <div className="flex h-full flex-col items-start bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
                  <div className="relative mb-4 h-32 w-full overflow-hidden rounded-xl bg-zinc-50 transition-transform duration-300 group-hover:scale-105">
                    <Image
                      src={feature.icon}
                      alt=""
                      fill
                      className="object-cover"
                      aria-hidden="true"
                    />
                  </div>
                  <dt className="text-lg font-semibold leading-7 text-zinc-900">
                    {feature.name}
                  </dt>
                  <span className={`mt-2 mb-3 h-1 w-10 rounded-full ${feature.accent}`} aria-hidden="true" />
                  <dd className="flex flex-auto flex-col text-base leading-7 text-zinc-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
