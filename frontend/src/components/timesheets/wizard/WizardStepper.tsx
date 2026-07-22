import React from 'react';

interface WizardStepperProps {
  currentStep: number;
}

export default function WizardStepper({ currentStep }: WizardStepperProps) {
  const steps = [
    { id: 1, name: 'Select Period', description: 'Choose weekly or monthly' },
    { id: 2, name: 'Fill Entries', description: 'Log your daily hours' },
    { id: 3, name: 'Review & Submit', description: 'Verify and save' },
  ];

  return (
    <div className="mb-10">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-center sm:justify-start">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-12 sm:pr-24' : ''}`}>
              {stepIdx !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full ${currentStep > step.id ? 'bg-indigo-600' : 'bg-zinc-200'}`} />
                </div>
              )}
              <div className="relative flex flex-col items-center group">
                <span className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ring-4 ring-white shadow-sm
                  ${currentStep > step.id ? 'bg-indigo-600 text-white' : 
                    currentStep === step.id ? 'bg-white border-2 border-indigo-600 text-indigo-600' : 
                    'bg-white border-2 border-zinc-300 text-zinc-500'}
                `}>
                  {currentStep > step.id ? (
                    <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>
                <span className={`absolute -bottom-8 text-xs font-semibold whitespace-nowrap
                  ${currentStep >= step.id ? 'text-indigo-900' : 'text-zinc-500'}
                `}>
                  {step.name}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
