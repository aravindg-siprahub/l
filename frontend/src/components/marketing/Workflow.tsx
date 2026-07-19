import Reveal from './Reveal';

const steps = [
  { id: 1, name: 'Candidate Submission', description: 'Candidate submits a timesheet for the billing period.', icon: '🧑‍💻' },
  { id: 2, name: 'Client Manager Approval', description: 'Client receives email notification and approves/rejects.', icon: '✅' },
  { id: 3, name: 'Finance Validation', description: 'HR & Accounts teams validate attendance and billable hours.', icon: '🏦' },
  { id: 4, name: 'AI Invoice Generation', description: 'AI calculates totals, taxes, and generates the PDF.', icon: '🤖' },
  { id: 5, name: 'Invoice Delivery', description: 'Approved invoice is automatically sent to the client.', icon: '📤' },
  { id: 6, name: 'Reports & Audit', description: 'System logs the activity and updates analytics dashboards.', icon: '📈' },
];

export default function Workflow() {
  return (
    <div id="workflow" className="py-24 sm:py-32 border-y border-zinc-200/70">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">How it works</h2>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            Our streamlined 6-step workflow ensures accuracy, compliance, and speed at every stage of the billing lifecycle.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="relative">
            <div className="absolute left-6 md:left-[calc(50%-0.5px)] top-0 bottom-0 w-0.5 bg-zinc-200 hidden sm:block"></div>

            <div className="space-y-12 md:space-y-0">
              {steps.map((step, index) => (
                <div key={step.id} className={`relative flex flex-col md:flex-row gap-8 items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} md:py-8`}>
                  <Reveal
                    direction="up"
                    className="hidden sm:flex absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-indigo-100 border-4 border-white items-center justify-center text-xl shadow-sm z-10"
                  >
                    {step.icon}
                  </Reveal>

                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pl-16 lg:pl-24' : 'md:pr-16 lg:pr-24 text-left md:text-right'}`}>
                    <Reveal direction={index % 2 === 0 ? 'right' : 'left'}>
                      <div className="flex flex-col gap-2 bg-zinc-50 p-6 rounded-2xl border border-zinc-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                        <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Step {step.id}</span>
                        <h3 className="text-xl font-bold text-zinc-900">{step.name}</h3>
                        <p className="text-zinc-600">{step.description}</p>
                      </div>
                    </Reveal>
                  </div>
                  <div className="hidden md:block md:w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
