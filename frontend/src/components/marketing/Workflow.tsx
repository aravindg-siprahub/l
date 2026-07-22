import Image from 'next/image';
import Reveal from './Reveal';

const steps = [
  {
    id: 1,
    name: 'Candidate Submission',
    description: 'Candidate submits a timesheet for the billing period.',
    icon: '🧑‍💻',
    accent: 'bg-blue-100 text-blue-600',
    numberColor: 'text-blue-600',
    image: '/workflow/step1-timesheet-laptop.png',
  },
  {
    id: 2,
    name: 'Client Manager Approval',
    description: 'Client receives email notification and approves/rejects.',
    icon: '✅',
    accent: 'bg-emerald-100 text-emerald-600',
    numberColor: 'text-emerald-600',
    image: '/workflow/step2-approval-phone.png',
  },
  {
    id: 3,
    name: 'Finance Validation',
    description: 'HR & Accounts teams validate attendance and billable hours.',
    icon: '🏦',
    accent: 'bg-violet-100 text-violet-600',
    numberColor: 'text-violet-600',
    image: '/workflow/step3-validation-summary.png',
  },
  {
    id: 4,
    name: 'AI Invoice Generation',
    description: 'AI calculates totals, taxes, and generates the PDF.',
    icon: '🤖',
    accent: 'bg-orange-100 text-orange-600',
    numberColor: 'text-orange-600',
    image: '/workflow/step4-invoice-laptop.png',
  },
  {
    id: 5,
    name: 'Invoice Delivery',
    description: 'Approved invoice is automatically sent to the client.',
    icon: '📤',
    accent: 'bg-teal-100 text-teal-600',
    numberColor: 'text-teal-600',
    image: '/workflow/step5-invoice-sent.png',
  },
  {
    id: 6,
    name: 'Reports & Audit',
    description: 'System logs the activity and updates analytics dashboards.',
    icon: '📈',
    accent: 'bg-indigo-100 text-indigo-600',
    numberColor: 'text-indigo-600',
    image: '/workflow/step6-reports-overview.png',
  },
];

export default function Workflow() {
  return (
    <div id="workflow" className="py-24 sm:py-32 border-y border-zinc-200/70">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            HOW IT{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
              WORKS
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-zinc-600">
            A streamlined 6-step process that ensures accuracy, compliance, and speed across the entire billing lifecycle.
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
                    className="hidden sm:flex absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-indigo-100 items-center justify-center text-sm font-bold shadow-sm z-10"
                  >
                    <span className={step.numberColor}>{String(step.id).padStart(2, '0')}</span>
                  </Reveal>

                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pl-16 lg:pl-24' : 'md:pr-16 lg:pr-24 text-left md:text-right'}`}>
                    <Reveal direction={index % 2 === 0 ? 'right' : 'left'}>
                      <div className={`flex flex-col gap-2 bg-zinc-50 p-6 rounded-2xl border border-zinc-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${index % 2 === 0 ? '' : 'md:items-end'}`}>
                        <div className={`flex items-center gap-3 ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${step.accent}`} aria-hidden="true">
                            {step.icon}
                          </span>
                          <span className={`text-sm font-semibold uppercase tracking-wider ${step.numberColor}`}>
                            Step {step.id}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900">{step.name}</h3>
                        <p className="text-zinc-600">{step.description}</p>
                      </div>
                    </Reveal>
                  </div>

                  <div className="hidden md:block md:w-1/2">
                    <Reveal direction={index % 2 === 0 ? 'left' : 'right'}>
                      <div className={`relative aspect-[16/10] w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 shadow-md ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}>
                        <Image
                          src={step.image}
                          alt={step.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Reveal>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
