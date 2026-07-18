'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { invoicesApi, InvoiceListItem } from '@/lib/invoices';
import { format, parseISO, startOfMonth, isSameMonth, subMonths } from 'date-fns';

// -- helpers

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function statusLabel(s: InvoiceListItem['status']) {
  const map: Record<string, string> = {
    draft: 'Draft', ready: 'Ready', sent: 'Sent', payment_pending: 'Payment Pending', paid: 'Paid',
  };
  return map[s] ?? s;
}

function statusColor(s: InvoiceListItem['status']) {
  switch (s) {
    case 'paid': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'sent': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    case 'payment_pending': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
    case 'ready': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    default: return 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200';
  }
}

// -- bar chart

interface Bar { label: string; value: number; current: boolean; }

function BarChart({ bars }: { bars: Bar[] }) {
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {bars.map(b => {
        const pct = Math.round((b.value / maxVal) * 100);
        return (
          <div key={b.label} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-xs font-semibold text-zinc-700">{b.value > 0 ? fmt(b.value) : ''}</span>
            <div className="relative w-full flex items-end" style={{ height: '80px' }}>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${b.current ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                style={{ height: `${pct}%`, minHeight: b.value > 0 ? '4px' : '0' }}
              />
            </div>
            <span className="text-xs text-zinc-500 text-center leading-tight">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// -- donut chart

const DONUT_COLORS: Record<string, string> = {
  paid: '#059669', sent: '#d97706', payment_pending: '#ea580c', ready: '#2563eb', draft: '#a1a1aa',
};

function DonutChart({ data }: { data: { label: string; value: number; status: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-zinc-400 text-center py-8">No invoices yet.</p>;

  let cumAngle = -90;
  const cx = 60, cy = 60, r = 50, ri = 32;

  function arc(start: number, sweep: number) {
    if (sweep >= 360) sweep = 359.99;
    const s = (start * Math.PI) / 180, e = ((start + sweep) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const ix1 = cx + ri * Math.cos(e), iy1 = cy + ri * Math.sin(e);
    const ix2 = cx + ri * Math.cos(s), iy2 = cy + ri * Math.sin(s);
    const lg = sweep > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ri} ${ri} 0 ${lg} 0 ${ix2} ${iy2} Z`;
  }

  const slices = data.filter(d => d.value > 0).map(d => {
    const sweep = (d.value / total) * 360;
    const path = arc(cumAngle, sweep);
    cumAngle += sweep;
    return { ...d, path };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {slices.map(s => <path key={s.status} d={s.path} fill={DONUT_COLORS[s.status] ?? '#a1a1aa'} />)}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#18181b">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#71717a">invoices</text>
      </svg>
      <ul className="space-y-1.5 flex-1">
        {data.filter(d => d.value > 0).map(d => (
          <li key={d.status} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[d.status] ?? '#a1a1aa' }} />
            <span className="text-zinc-700 text-xs">{d.label}</span>
            <span className="ml-auto font-bold text-zinc-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -- main page

type SortKey = 'issued_at' | 'total_amount' | 'total_hours' | 'invoice_number';
type SortDir = 'asc' | 'desc';

export default function BillingSummaryPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('issued_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    invoicesApi.getAll()
      .then(setInvoices)
      .catch((e: any) => setError(e.message || 'Failed to load invoices.'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const paid = invoices.filter(i => i.status === 'paid');
    const outstanding = invoices.filter(i => ['sent', 'payment_pending'].includes(i.status));
    const totalRevenue = paid.reduce((s, i) => s + i.total_amount, 0);
    const totalOutstanding = outstanding.reduce((s, i) => s + i.total_amount, 0);
    const totalHours = invoices.reduce((s, i) => s + i.total_hours, 0);
    const avgRate = invoices.length ? invoices.reduce((s, i) => s + i.hourly_rate, 0) / invoices.length : 0;

    const bars: Bar[] = Array.from({ length: 6 }, (_, idx) => {
      const monthDate = startOfMonth(subMonths(now, 5 - idx));
      const monthTotal = paid.filter(i => isSameMonth(parseISO(i.issued_at), monthDate)).reduce((s, i) => s + i.total_amount, 0);
      return { label: format(monthDate, 'MMM'), value: monthTotal, current: isSameMonth(monthDate, now) };
    });

    const thisMonthRevenue = paid.filter(i => isSameMonth(parseISO(i.issued_at), thisMonth)).reduce((s, i) => s + i.total_amount, 0);
    const lastMonthRevenue = paid.filter(i => isSameMonth(parseISO(i.issued_at), lastMonth)).reduce((s, i) => s + i.total_amount, 0);

    const donut = [
      { label: 'Paid', status: 'paid', value: paid.length },
      { label: 'Sent', status: 'sent', value: invoices.filter(i => i.status === 'sent').length },
      { label: 'Payment Pending', status: 'payment_pending', value: invoices.filter(i => i.status === 'payment_pending').length },
      { label: 'Ready', status: 'ready', value: invoices.filter(i => i.status === 'ready').length },
      { label: 'Draft', status: 'draft', value: invoices.filter(i => i.status === 'draft').length },
    ];

    return { totalRevenue, totalOutstanding, totalHours, avgRate, bars, donut, thisMonthRevenue, lastMonthRevenue };
  }, [invoices]);

  const tableData = useMemo(() => {
    let data = [...invoices];
    if (statusFilter !== 'all') data = data.filter(i => i.status === statusFilter);
    if (search.trim()) data = data.filter(i => i.invoice_number.toLowerCase().includes(search.toLowerCase()));
    data.sort((a, b) => {
      let av: any = a[sortKey as keyof InvoiceListItem];
      let bv: any = b[sortKey as keyof InvoiceListItem];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [invoices, statusFilter, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-zinc-500 ml-1">↕</span>;
    return <span className="ml-1 text-indigo-300">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  if (loading) return (
    <div className="p-12 flex flex-col items-center gap-3 text-zinc-500">
      <svg className="animate-spin h-7 w-7 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm">Loading billing summary…</span>
    </div>
  );

  const kpiCards = [
    { title: 'Total Revenue', value: fmt(stats.totalRevenue), sub: `${fmt(stats.thisMonthRevenue)} this month`, icon: '💰', cls: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
    { title: 'Outstanding', value: fmt(stats.totalOutstanding), sub: 'Sent + payment pending', icon: '⏳', cls: 'bg-orange-50 text-orange-600 ring-orange-200' },
    { title: 'Total Billed Hours', value: `${stats.totalHours.toLocaleString()}h`, sub: `Across ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`, icon: '🕐', cls: 'bg-indigo-50 text-indigo-600 ring-indigo-200' },
    { title: 'Avg Hourly Rate', value: stats.avgRate > 0 ? `$${stats.avgRate.toFixed(0)}/h` : '—', sub: 'Average across all invoices', icon: '📊', cls: 'bg-violet-50 text-violet-600 ring-violet-200' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Billing Summary</h2>
          <p className="mt-1 text-sm text-zinc-500">Revenue analytics, invoice status breakdown, and billing history</p>
        </div>
        <Link href="/dashboard/finance/invoices" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
          <span>📄</span> Invoice Queue
        </Link>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4"><p className="text-sm text-red-800">{error}</p></div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.title} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">{card.value}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{card.sub}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 text-xl ${card.cls}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Monthly Revenue (Paid)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Last 6 months</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">This month</p>
              <p className="text-lg font-bold text-emerald-600">{fmt(stats.thisMonthRevenue)}</p>
              {stats.lastMonthRevenue > 0 && <p className="text-xs text-zinc-400">vs {fmt(stats.lastMonthRevenue)} last month</p>}
            </div>
          </div>
          {invoices.length === 0
            ? <div className="h-28 flex items-center justify-center text-sm text-zinc-400">No invoice data yet</div>
            : <BarChart bars={stats.bars} />
          }
        </div>
        {/* Donut */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Invoice Status Breakdown</h3>
          <DonutChart data={stats.donut} />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-wrap gap-3 items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Billing History</h3>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search invoice #..."
                className="pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-zinc-700"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="sent">Sent</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:text-indigo-300 select-none" onClick={() => toggleSort('invoice_number')}>Invoice # <SortIcon k="invoice_number" /></th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Period</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:text-indigo-300 select-none" onClick={() => toggleSort('total_hours')}>Hours <SortIcon k="total_hours" /></th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">Rate</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:text-indigo-300 select-none" onClick={() => toggleSort('total_amount')}>Total <SortIcon k="total_amount" /></th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:text-indigo-300 select-none" onClick={() => toggleSort('issued_at')}>Issued <SortIcon k="issued_at" /></th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <p className="text-2xl mb-2">📋</p>
                    <p className="text-sm text-zinc-500">{invoices.length === 0 ? 'No invoices generated yet.' : 'No invoices match your filters.'}</p>
                  </td>
                </tr>
              ) : tableData.map((inv, i) => (
                <tr key={inv.id} className={`hover:bg-indigo-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/40'}`}>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-zinc-900">{inv.invoice_number}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-500">{format(parseISO(inv.period_start_date), 'MMM d')} – {format(parseISO(inv.period_end_date), 'MMM d, yyyy')}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-zinc-900 text-right">{inv.total_hours}h</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-500 text-right">${inv.hourly_rate.toFixed(2)}/h</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-indigo-700 text-right">${inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-500">{format(parseISO(inv.issued_at), 'dd MMM yyyy')}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(inv.status)}`}>{statusLabel(inv.status)}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm space-x-3">
                    <Link href={`/dashboard/finance/invoices/${inv.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">View</Link>
                    <Link href={`/dashboard/finance/invoices/${inv.id}?print=1`} className="text-zinc-500 hover:text-zinc-900 font-medium">PDF</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tableData.length > 0 && (
          <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
            <p className="text-xs text-zinc-400">Showing {tableData.length} of {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
            <p className="text-xs font-semibold text-zinc-700">Filtered total: {fmt(tableData.reduce((s, i) => s + i.total_amount, 0))}</p>
          </div>
        )}
      </div>
    </div>
  );
}
