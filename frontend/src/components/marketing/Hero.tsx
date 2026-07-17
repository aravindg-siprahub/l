export default function Hero() {
  return (
    <div className="relative isolate pt-14 bg-white min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#c7d2fe] to-[#a5f3fc] opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="py-24 sm:py-32 lg:pb-40 w-full max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center animate-fade-in-up">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-zinc-600 ring-1 ring-zinc-900/10 hover:ring-zinc-900/20 transition-all cursor-pointer bg-white/80">
              Announcing our new AI Invoice Generation.{' '}
              <a href="#features" className="font-semibold text-indigo-600">
                <span className="absolute inset-0" aria-hidden="true"></span>Read more <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Automate Timesheets &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
              Invoice Generation
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            The AI-powered platform that simplifies operations for staffing and consulting businesses. Reduce manual work, improve billing accuracy, and maintain complete visibility across the approval lifecycle.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <a href="#contact" className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95">
              Get Started
            </a>
            <a href="/login" className="text-sm font-semibold leading-6 text-zinc-900 hover:text-indigo-600 transition-colors">
              Log in <span aria-hidden="true">→</span>
            </a>
            <a href="#contact" className="text-sm font-semibold leading-6 text-zinc-600 border-b border-transparent hover:border-zinc-400 transition-all">
              Request Demo
            </a>
          </div>
        </div>

        {/* App UI Mockup */}
        <div className="mt-16 flow-root sm:mt-24 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="-m-2 rounded-xl bg-zinc-900/5 p-2 ring-1 ring-inset ring-zinc-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
            <div className="rounded-md bg-white shadow-2xl ring-1 ring-zinc-900/10 overflow-hidden">
              <div className="h-10 bg-zinc-100 border-b border-zinc-200 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="h-64 sm:h-96 md:h-[30rem] bg-zinc-50 p-4 sm:p-8">
                <div className="w-full h-full border border-dashed border-zinc-300 rounded-lg flex items-center justify-center text-zinc-400 font-mono text-sm">
                  Interactive Dashboard Demo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#c7d2fe] to-[#a5f3fc] opacity-40 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
    </div>
  );
}
