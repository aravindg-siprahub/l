import Reveal from './Reveal';

const benefits = [
  {
    icon: '⚡',
    iconBg: 'bg-amber-100',
    title: 'Faster Approval Process.',
    description: 'Automated notifications via Microsoft Graph API mean managers approve timesheets in seconds, not days.',
  },
  {
    icon: '📉',
    iconBg: 'bg-blue-100',
    title: 'Reduced Processing Errors.',
    description: 'AI-driven validation prevents mismatched hours, incorrect rates, and billing discrepancies before they happen.',
  },
  {
    icon: '⏱️',
    iconBg: 'bg-zinc-200',
    title: 'Time Saved on Invoicing.',
    description: 'What used to take an accounting team hours is now done instantly by AI, including tax calculation and PDF generation.',
  },
];

const metrics = [
  { value: '85%', label: 'Less manual effort', tone: 'bg-violet-100 text-violet-700' },
  { value: '3x', label: 'Faster invoice generation', tone: 'bg-emerald-100 text-emerald-700' },
  { value: '99%', label: 'Billing accuracy', tone: 'bg-amber-100 text-amber-600' },
  { value: '100%', label: 'Audit compliance', tone: 'bg-cyan-100 text-cyan-700' },
];

export default function PlatformBenefits() {
  return (
    <div id="benefits" className="py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-center">
          <Reveal direction="left" className="lg:pr-8 lg:pt-4">
            <div className="lg:max-w-lg">
              <p className="text-4xl font-black tracking-tight text-indigo-950 sm:text-5xl">Platform Benefits</p>

              <dl className="mt-12 max-w-xl space-y-9 lg:max-w-none">
                {benefits.map((benefit, i) => (
                  <Reveal key={benefit.title} delay={150 + i * 100}>
                    <div className="group">
                      <dt className="flex items-center gap-4">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-transform duration-300 group-hover:scale-110 ${benefit.iconBg}`}>
                          {benefit.icon}
                        </span>
                        <span className="text-xl font-bold text-zinc-900">{benefit.title}</span>
                      </dt>
                      <dd className="mt-2 pl-16 text-base leading-7 text-zinc-600">{benefit.description}</dd>
                    </div>
                  </Reveal>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal direction="right" delay={100} className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 p-2 ring-1 ring-inset ring-zinc-900/10 lg:-m-4 lg:rounded-3xl lg:p-4">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-zinc-900/10 p-8 flex flex-col gap-6">
                <h3 className="text-xl font-bold text-zinc-900 text-center">Efficiency Metrics</h3>

                <div className="grid grid-cols-2 gap-6">
                  {metrics.map((metric, i) => {
                    const [bg, text] = metric.tone.split(' ');
                    return (
                      <Reveal key={metric.label} delay={250 + i * 100}>
                        <div className={`rounded-xl p-6 text-center ${bg} transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}>
                          <div className={`text-4xl font-extrabold mb-1 ${text}`}>{metric.value}</div>
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
