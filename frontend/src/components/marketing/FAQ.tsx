'use client';
import { useState } from 'react';

const faqs = [
  {
    question: "How does the AI invoice generation work?",
    answer: "Our AI engine automatically pulls approved timesheet data, calculates total billable amounts based on contract rates, applies relevant taxes, and generates a formatted PDF invoice without human intervention."
  },
  {
    question: "Do clients need an account to approve timesheets?",
    answer: "No. Client Managers receive an email via Microsoft Graph API with a secure link to approve, reject, or add comments to the timesheet directly, reducing friction."
  },
  {
    question: "Can we track who approved what and when?",
    answer: "Yes. The platform maintains strict Audit Logs. Every submission, approval, edit, and invoice delivery is tracked with user IDs and timestamps for compliance purposes."
  },
  {
    question: "What happens if a timesheet is rejected?",
    answer: "If a Client Manager or HR rejects a timesheet, the Candidate receives an immediate notification with the rejection reason. They can then edit and resubmit the timesheet, restarting the workflow."
  },
  {
    question: "Is the platform secure?",
    answer: "Absolutely. We implement JWT-based authentication with strict Role-Based Access Control (RBAC). Data is stored securely in Supabase PostgreSQL, and all communications are encrypted."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div id="faq" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl divide-y divide-zinc-200">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-zinc-900 text-center mb-10">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-6 divide-y divide-zinc-200">
            {faqs.map((faq, index) => (
              <div key={index} className="pt-6">
                <dt>
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="flex w-full items-start justify-between text-left text-zinc-900 group"
                  >
                    <span className="text-base font-semibold leading-7">{faq.question}</span>
                    <span className="ml-6 flex h-7 items-center">
                      <span className={`transform transition-transform duration-200 text-indigo-600 font-bold text-xl ${openIndex === index ? 'rotate-180' : ''}`}>
                        ↓
                      </span>
                    </span>
                  </button>
                </dt>
                {openIndex === index && (
                  <dd className="mt-4 pr-12 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                    <p className="text-base leading-7 text-zinc-600">{faq.answer}</p>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
