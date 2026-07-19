import Reveal from './Reveal';

const benefits = [
  {
    icon: '⚡',
    title: 'Faster Approval Process.',
    description: 'Automated notifications via Microsoft Graph API mean managers approve timesheets in seconds, not days.',
  },
  {
    icon: '📉',
    title: 'Reduced Processing Errors.',
    description: 'AI-driven validation prevents mismatched hours, incorrect rates, and billing discrepancies before they happen.',
  },
  {
    icon: '⏱️',
    title: 'Time Saved on Invoicing.',
    description: 'What used to take an accounting team hours is now done instantly by AI, including tax calculation and PDF generation.',
  },
];

const metrics = [
  { value: '85%', label: 'Less manual effort', tone: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
  { value: '3x', label: 'Faster invoice generation', tone: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
  { value: '99%', label: 'Billing accuracy', tone: 'bg-amber-50 border-amber-100 text-amber-600' },
  { value: '100%', label: 'Audit compliance', tone: 'bg-cyan-50 border-cyan-100 text-cyan-600' },
];

export default function PlatformBenefits() {
  return (
    <div id="benefits" className="py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-center">
          <Reveal direction="left" className="lg:pr-8 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Maximize ROI</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Platform Benefits</p>
              <p className="mt-6 text-lg leading-8 text-zinc-600">
                Stop wasting hours on manual data entry and email follow-ups. Lorvish transforms your back-office operations into a competitive advantage.
              </p>

              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-zinc-600 lg:max-w-none">
                {benefits.map((benefit, i) => (
                  <Reveal key={benefit.title} delay={150 + i * 100}>
                    <div className="relative pl-12 group">
                      <dt className="inline font-semibold text-zinc-900">
                        <span className="absolute left-1 top-1 text-2xl transition-transform duration-300 group-hover:scale-110">{benefit.icon}</span>
                        {benefit.title}
                      </dt>{' '}
                      <dd className="inline">{benefit.description}</dd>
                    </div>
                  </Reveal>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal direction="right" delay={100} className="relative">
            <div className="rounded-2xl bg-zinc-900/5 p-2 ring-1 ring-inset ring-zinc-900/10 lg:-m-4 lg:rounded-3xl lg:p-4">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-zinc-900/10 p-8 flex flex-col gap-6">
                <h3 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-4">Efficiency Metrics</h3>

                <div className="grid grid-cols-2 gap-6">
                  {metrics.map((metric, i) => {
                    const [bg, border, text] = metric.tone.split(' ');
                    return (
                      <Reveal key={metric.label} delay={250 + i * 100}>
                        <div className={`rounded-lg p-4 border ${bg} ${border} transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}>
                          <div className={`text-3xl font-bold mb-1 ${text}`}>{metric.value}</div>
                          <div className="text-sm font-medium text-zinc-700">{metric.label}</div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
