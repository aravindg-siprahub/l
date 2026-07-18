'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { invoicesApi, InvoiceListItem } from '@/lib/invoices';
import { format, parseISO } from 'date-fns';

const statusBadge = (status: InvoiceListItem['status']) => {
  switch (status) {
    case 'draft': return <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-500/20">Draft</span>;
    case 'ready': return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Ready</span>;
    case 'sent': return <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Sent</span>;
    case 'payment_pending': return <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">Payment Pending</span>;
    case 'paid': return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">Paid</span>;
    default: return <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{status}</span>;
  }
};

export default function FinanceInvoiceList() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    invoicesApi.getAll()
      .then(setInvoices)
      .catch((e: any) => setError(e.message || 'Failed to load invoices.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading invoices...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Invoice Management</h2>
        <p className="mt-1 text-sm text-zinc-500">View, download, and track all generated invoices.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm ring-1 ring-zinc-200 sm:rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Invoice #</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Period</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Hours</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Rate</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Total</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Issued</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-zinc-500">
                  No invoices generated yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv, i) => (
                <tr key={inv.id} className={i % 2 === 0 ? 'bg-white' : 'bg-indigo-50/20'}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-zinc-900">{inv.invoice_number}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {format(parseISO(inv.period_start_date), 'MMM d')} – {format(parseISO(inv.period_end_date), 'MMM d, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">{inv.total_hours}h</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">${inv.hourly_rate.toFixed(2)}/h</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-indigo-700">${inv.total_amount.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {format(parseISO(inv.issued_at), 'MMM d, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{statusBadge(inv.status)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm space-x-3">
                    <Link href={`/dashboard/finance/invoices/${inv.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">View</Link>
                    <Link href={`/dashboard/finance/invoices/${inv.id}?print=1`} className="text-zinc-600 hover:text-zinc-900 font-medium">Download</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
