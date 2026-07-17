export default function PlatformBenefits() {
  return (
    <div id="benefits" className="py-24 sm:py-32 bg-zinc-50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-center">
          <div className="lg:pr-8 lg:pt-4">
            <div className="lg:max-w-lg">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Maximize ROI</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Platform Benefits</p>
              <p className="mt-6 text-lg leading-8 text-zinc-600">
                Stop wasting hours on manual data entry and email follow-ups. Lorvish transforms your back-office operations into a competitive advantage.
              </p>

              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-zinc-600 lg:max-w-none">
                <div className="relative pl-12 group">
                  <dt className="inline font-semibold text-zinc-900">
                    <span className="absolute left-1 top-1 text-2xl group-hover:scale-110 transition-transform">⚡</span>
                    Faster Approval Process.
                  </dt>{' '}
                  <dd className="inline">Automated notifications via Microsoft Graph API mean managers approve timesheets in seconds, not days.</dd>
                </div>
                <div className="relative pl-12 group">
                  <dt className="inline font-semibold text-zinc-900">
                    <span className="absolute left-1 top-1 text-2xl group-hover:scale-110 transition-transform">📉</span>
                    Reduced Processing Errors.
                  </dt>{' '}
                  <dd className="inline">AI-driven validation prevents mismatched hours, incorrect rates, and billing discrepancies before they happen.</dd>
                </div>
                <div className="relative pl-12 group">
                  <dt className="inline font-semibold text-zinc-900">
                    <span className="absolute left-1 top-1 text-2xl group-hover:scale-110 transition-transform">⏱️</span>
                    Time Saved on Invoicing.
                  </dt>{' '}
                  <dd className="inline">What used to take an accounting team hours is now done instantly by AI, including tax calculation and PDF generation.</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl bg-zinc-900/5 p-2 ring-1 ring-inset ring-zinc-900/10 lg:-m-4 lg:rounded-3xl lg:p-4">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-zinc-900/10 p-8 flex flex-col gap-6">
                <h3 className="text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-4">Efficiency Metrics</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">85%</div>
                    <div className="text-sm font-medium text-zinc-700">Less manual effort</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">3x</div>
                    <div className="text-sm font-medium text-zinc-700">Faster invoice generation</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <div className="text-3xl font-bold text-amber-600 mb-1">99%</div>
                    <div className="text-sm font-medium text-zinc-700">Billing accuracy</div>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
                    <div className="text-3xl font-bold text-cyan-600 mb-1">100%</div>
                    <div className="text-sm font-medium text-zinc-700">Audit compliance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
