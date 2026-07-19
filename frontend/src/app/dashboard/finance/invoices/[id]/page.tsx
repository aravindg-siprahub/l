'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { invoicesApi } from '@/lib/invoices';
import { Invoice } from '@/lib/finance';
import { format, parseISO } from 'date-fns';

export default function InvoiceTemplate() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    client_name: '',
    billing_contact: '',
    billing_email: '',
    billing_address: '',
    payment_terms: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const openEditModal = () => {
    if (!invoice) return;
    setEditForm({
      client_name: invoice.snapshot_data?.client_name || '',
      billing_contact: invoice.snapshot_data?.billing_contact || '',
      billing_email: invoice.snapshot_data?.billing_email || '',
      billing_address: invoice.snapshot_data?.billing_address || '',
      payment_terms: invoice.payment_terms || '',
      notes: invoice.notes || ''
    });
    setIsEditing(true);
  };

  const handleSaveBilling = async () => {
    if (!invoice) return;
    if (!editForm.client_name.trim()) {
      alert('Client Name is required');
      return;
    }
    setSaving(true);
    try {
      const updated = await invoicesApi.updateBilling(invoice.id, {
        client_name: editForm.client_name,
        billing_contact: editForm.billing_contact || undefined,
        billing_email: editForm.billing_email || undefined,
        billing_address: editForm.billing_address || undefined,
        payment_terms: editForm.payment_terms,
        notes: editForm.notes || undefined
      });
      setInvoice(updated);
      setIsEditing(false);
    } catch (e: any) {
      alert(e.message || 'Failed to save billing information.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    invoicesApi.getById(params.id as string)
      .then((inv) => {
        setInvoice(inv);
        if (searchParams.get('print') === '1') {
          setTimeout(() => window.print(), 600);
        }
      })
      .catch((e: any) => setError(e.message || 'Failed to load invoice.'))
      .finally(() => setLoading(false));
  }, [params.id, searchParams]);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading invoice...</div>;
  if (error || !invoice) return <div className="p-8 text-center text-red-500">{error || 'Invoice not found.'}</div>;

  const subtotal = invoice.subtotal;
  const taxAmt = invoice.tax_amount;
  const total = invoice.total_amount;

  // Parse entries from work_summary for display (we use API entries via timesheet — show as summary line items)
  const lineItems = invoice.work_summary
    .replace(/^Professional services rendered.*?Work performed: /, '')
    .replace(/\. Total hours:.*$/, '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  const handleTransition = async (targetStatus: string) => {
    if (!invoice) return;
    try {
      const updated = await invoicesApi.transition(invoice.id, targetStatus, `Transitioned to ${targetStatus}`);
      setInvoice(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .invoice-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print flex items-center justify-between mb-6 px-2">
        <button
          onClick={() => window.history.back()}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {(invoice.status === 'draft' || invoice.status === 'ready') && (
            <button
              onClick={openEditModal}
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50"
            >
              Edit Billing
            </button>
          )}
          {invoice.status === 'draft' && (
            <button
              onClick={() => handleTransition('ready')}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Mark as Ready
            </button>
          )}
          {invoice.status === 'ready' && (
            <button
              onClick={() => handleTransition('sent')}
              className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
            >
              Mark as Sent
            </button>
          )}
          {invoice.status === 'sent' && (
            <button
              onClick={() => handleTransition('payment_pending')}
              className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
            >
              Mark Payment Pending
            </button>
          )}
          {invoice.status === 'payment_pending' && (
            <button
              onClick={() => handleTransition('paid')}
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Mark as Paid
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* ── INVOICE DOCUMENT ── */}
      <div className="invoice-page mx-auto max-w-[820px] bg-white shadow-xl">

        {/* ══ HEADER BAND ══ */}
        <div className="relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between px-10 pt-8 pb-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/lorvish-logo.png" alt="Lorvish Logo" className="h-14 w-auto object-contain" />
            </div>

            {/* INVOICE title + number */}
            <div className="text-right pt-1">
              <p className="text-4xl font-black tracking-tight text-indigo-600 leading-none">INVOICE</p>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-zinc-500 font-medium">Invoice No:</p>
                <p className="text-xl font-black text-zinc-900">{invoice.invoice_number}</p>
                <p className="text-xs text-zinc-500">{format(parseISO(invoice.issued_at), 'dd-MM-yyyy')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ BILL TO + PERIOD ══ */}
        <div className="px-10 pb-6 pt-2 flex flex-wrap justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Invoice To:</p>
            <p className="text-sm font-bold text-zinc-900">{invoice.snapshot_data?.client_name || 'Client / Project Manager'}</p>
            {invoice.snapshot_data?.billing_contact && <p className="text-sm text-zinc-600">{invoice.snapshot_data.billing_contact}</p>}
            {invoice.snapshot_data?.billing_address && <p className="text-sm text-zinc-600 whitespace-pre-wrap">{invoice.snapshot_data.billing_address}</p>}
            {invoice.snapshot_data?.billing_email && <p className="text-sm text-zinc-600">{invoice.snapshot_data.billing_email}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Service Period:</p>
            <p className="text-sm font-bold text-zinc-900">
              {format(parseISO(invoice.period_start_date), 'dd MMM yyyy')} – {format(parseISO(invoice.period_end_date), 'dd MMM yyyy')}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Due: {format(parseISO(invoice.due_date), 'dd MMM yyyy')} &nbsp;·&nbsp; {invoice.payment_terms}
            </p>
          </div>
        </div>

        {/* ══ LINE ITEMS TABLE ══ */}
        <div className="px-10 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-600 border-y border-zinc-200">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider w-1/2">Product / Description</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Qty (hrs)</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-indigo-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length > 0 ? lineItems.map((item, i) => {
                // Try to parse "description (Xh)" format
                const match = item.match(/^(.*?)\s*\((\d+(?:\.\d+)?)h\)$/);
                const desc = match ? match[1] : item;
                const hrs = match ? parseFloat(match[2]) : null;
                const lineTotal = hrs !== null ? (hrs * invoice.hourly_rate).toFixed(2) : '—';
                return (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-indigo-50/40'}>
                    <td className="px-4 py-3 text-zinc-700">{desc}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">${invoice.hourly_rate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">{hrs ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900">${lineTotal}</td>
                  </tr>
                );
              }) : (
                <tr className="bg-white">
                  <td className="px-4 py-3 text-zinc-700">Professional staffing services</td>
                  <td className="px-4 py-3 text-right text-zinc-600">${invoice.hourly_rate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{invoice.total_hours}</td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900">${subtotal.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ══ TOTALS ══ */}
        <div className="px-10 mb-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-zinc-600">
              <span className="font-semibold uppercase tracking-wide">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span className="font-semibold uppercase tracking-wide">Tax ({(invoice.tax_rate * 100).toFixed(0)}%)</span>
              <span>${taxAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center bg-indigo-50 text-indigo-900 rounded px-3 py-2 border border-indigo-100 mt-2">
              <span className="font-bold uppercase tracking-wide text-sm">Total</span>
              <span className="font-black text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ══ WORK SUMMARY ══ */}
        <div className="px-10 mb-6">
          <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-4">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">Work Summary</p>
            <p className="text-sm text-zinc-600 leading-relaxed">{invoice.work_summary}</p>
          </div>
        </div>

        {/* ══ PAYMENT INFO BAND ══ */}
        <div className="px-10 mb-6">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5">
            <p className="text-xs font-black text-zinc-800 uppercase tracking-widest mb-3">Payment Info:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider">Account Name:</p>
                <p className="text-zinc-900 font-semibold mt-0.5">Lorvish Global Staffing Pvt Ltd</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider">Bank Name:</p>
                <p className="text-zinc-900 font-semibold mt-0.5">HDFC Bank / SWIFT: HDFCINBB</p>
              </div>
            </div>
            {invoice.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <p className="text-zinc-600 text-xs">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ TERMS & CONDITIONS ══ */}
        <div className="px-10 py-5">
          <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Terms &amp; Conditions</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Payment is due within {invoice.payment_terms.replace('Net ', '')} days of the invoice date.
            Late payments may be subject to a 1.5% monthly service charge.
            This invoice is for professional staffing services rendered and is non-refundable once payment is received.
            Please reference the invoice number in all payment correspondence.
          </p>
        </div>

        {/* ══ FOOTER BAR ══ */}
        <div className="bg-zinc-900 px-10 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              +91-123-456-7890
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
              www.lorvish.com
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              USA North Virginia
            </span>
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="relative z-50 no-print" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-zinc-500 bg-opacity-75"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-xl sm:p-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Billing Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Client / Company Name *</label>
                    <input type="text" value={editForm.client_name} onChange={e => setEditForm({...editForm, client_name: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Billing Contact</label>
                      <input type="text" value={editForm.billing_contact} onChange={e => setEditForm({...editForm, billing_contact: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Billing Email</label>
                      <input type="email" value={editForm.billing_email} onChange={e => setEditForm({...editForm, billing_email: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Billing Address</label>
                    <textarea rows={2} value={editForm.billing_address} onChange={e => setEditForm({...editForm, billing_address: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Payment Terms</label>
                    <input type="text" value={editForm.payment_terms} onChange={e => setEditForm({...editForm, payment_terms: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-1">Finance Notes</label>
                    <textarea rows={2} value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50" disabled={saving}>Cancel</button>
                  <button type="button" onClick={handleSaveBilling} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
