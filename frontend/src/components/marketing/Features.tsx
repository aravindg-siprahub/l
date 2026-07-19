import Reveal from './Reveal';

const features = [
  {
    name: 'AI Timesheet Management',
    description: 'Automate candidate submissions, validate hours effortlessly, and track status with intelligent validation rules that prevent common errors.',
    icon: '⏳'
  },
  {
    name: 'Client Approval Workflow',
    description: 'Seamlessly send approval requests via Microsoft Graph API. Clients can approve, reject, or add comments with a single click.',
    icon: '✅'
  },
  {
    name: 'Finance Validation',
    description: 'HR and Accounts teams verify employee allocation, attendance, and billable hours through an optimized queue before invoicing.',
    icon: '📊'
  },
  {
    name: 'AI Invoice Generation',
    description: 'Our AI engine automatically calculates billing amounts, computes taxes, generates the invoice PDF, and drafts the delivery email.',
    icon: '🤖'
  },
  {
    name: 'Invoice Tracking',
    description: 'Complete visibility into invoice status. Know exactly when an invoice is generated, sent, viewed, and paid by the client.',
    icon: '👀'
  },
  {
    name: 'Audit Logs',
    description: 'Maintain compliance with a complete audit history of all actions, approvals, edits, and system activities across all modules.',
    icon: '📋'
  },
  {
    name: 'Analytics Dashboard',
    description: 'Role-specific dashboards providing actionable insights, pending tasks, recent activity, and workflow statistics at a glance.',
    icon: '📈'
  },
  {
    name: 'Role-Based Access Control',
    description: 'Secure, granular permissions ensuring Candidates, Client Managers, HR, Finance, and Admins only see what they need to.',
    icon: '🔐'
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
                <div className="flex h-full flex-col items-start bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                  <div className="rounded-lg bg-indigo-50 p-3 ring-1 ring-indigo-200 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <span className="text-2xl" aria-hidden="true">{feature.icon}</span>
                  </div>
                  <dt className="text-lg font-semibold leading-7 text-zinc-900">
                    {feature.name}
                  </dt>
                  <dd className="mt-2 flex flex-auto flex-col text-base leading-7 text-zinc-600">
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
