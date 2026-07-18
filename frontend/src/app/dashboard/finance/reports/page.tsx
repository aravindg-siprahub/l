'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { invoicesApi, InvoiceListItem } from '@/lib/invoices';
import { financeApi, DashboardStats } from '@/lib/finance';
import { format, parseISO, startOfMonth, isSameMonth, subMonths, differenceInDays } from 'date-fns';

// ---- Utilities ---------------------------------------------------------------

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function fmtFull(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function pct(a: number, b: number) {
  return b === 0 ? '0%' : `${((a / b) * 100).toFixed(1)}%`;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#059669',
  sent: '#d97706',
  payment_pending: '#ea580c',
  ready: '#2563eb',
  draft: '#a1a1aa',
};
const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid', sent: 'Sent', payment_pending: 'Payment Pending', ready: 'Ready', draft: 'Draft',
};

// ---- Mini line sparkline (SVG) -----------------------------------------------

function Sparkline({ values, color = '#4f46e5' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 120, h = 36, pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- Horizontal bar row ------------------------------------------------------

function HBar({ label, value, max, color, amount }: { label: string; value: number; max: number; color: string; amount: string }) {
  const pctVal = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-xs text-zinc-500 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pctVal}%`, background: color }} />
      </div>
      <span className="w-20 text-right text-xs font-semibold text-zinc-700 flex-shrink-0">{amount}</span>
      <span className="w-8 text-right text-xs text-zinc-400 flex-shrink-0">{value}</span>
    </div>
  );
}

// ---- Metric card -------------------------------------------------------------

function MetricCard({ icon, title, value, sub, delta, deltaPos, accent }:
  { icon: string; title: string; value: string; sub?: string; delta?: string; deltaPos?: boolean; accent: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 text-xl ${accent}`}>{icon}</div>
        {delta && (
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${deltaPos ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {deltaPos ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 mt-1">{title}</p>
        <p className="text-2xl font-bold text-zinc-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ---- Revenue Area Chart (SVG) ------------------------------------------------

function AreaChart({ bars }: { bars: { label: string; value: number; current: boolean }[] }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  const w = 540, h = 120, pad = 8;
  const pts = bars.map((b, i) => {
    const x = pad + (i / (bars.length - 1)) * (w - pad * 2);
    const y = h - pad - (b.value / max) * (h - pad * 2);
    return { x, y, ...b };
  });
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M ${pts[0].x},${h - pad} ` + pts.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${pts[pts.length - 1].x},${h - pad} Z`;

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${w} ${h + 24}`} className="w-full" style={{ minWidth: 280 }}>
        {/* area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />
        <polyline points={polyline} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.current ? 5 : 3.5} fill={p.current ? '#4f46e5' : '#a5b4fc'} stroke="white" strokeWidth="1.5" />
            <text x={p.x} y={h + 16} textAnchor="middle" fontSize="9" fill="#71717a">{p.label}</text>
            {p.value > 0 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fill="#4f46e5" fontWeight="600">
                {fmt(p.value)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---- Main Page ---------------------------------------------------------------

type Tab = 'overview' | 'revenue' | 'invoices' | 'efficiency';

export default function FinanceReportsPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<number>(6); // months

  useEffect(() => {
    Promise.all([invoicesApi.getAll(), financeApi.getDashboardStats()])
      .then(([inv, st]) => { setInvoices(inv); setStats(st); })
      .catch((e: any) => setError(e.message || 'Failed to load report data.'))
      .finally(() => setLoading(false));
  }, []);

  const report = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: period }, (_, i) => startOfMonth(subMonths(now, period - 1 - i)));

    const paid = invoices.filter(i => i.status === 'paid');
    const outstanding = invoices.filter(i => ['sent', 'payment_pending'].includes(i.status));

    // Revenue by month
    const revenueByMonth = months.map(m => ({
      label: format(m, 'MMM yy'),
      value: paid.filter(i => isSameMonth(parseISO(i.issued_at), m)).reduce((s, i) => s + i.total_amount, 0),
      current: isSameMonth(m, now),
    }));

    // Invoices created by month
    const invoicesByMonth = months.map(m => ({
      label: format(m, 'MMM yy'),
      count: invoices.filter(i => isSameMonth(parseISO(i.issued_at), m)).length,
      paid: invoices.filter(i => isSameMonth(parseISO(i.issued_at), m) && i.status === 'paid').length,
    }));

    // Status distribution
    const statusDist = Object.entries(
      invoices.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).map(([status, count]) => ({ status, count, amount: invoices.filter(i => i.status === status).reduce((s, i) => s + i.total_amount, 0) }))
      .sort((a, b) => b.count - a.count);

    const maxCount = Math.max(...statusDist.map(s => s.count), 1);

    // Rate distribution
    const rates = invoices.map(i => i.hourly_rate).filter(Boolean);
    const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    const minRate = rates.length ? Math.min(...rates) : 0;
    const maxRate = rates.length ? Math.max(...rates) : 0;

    // Hours by month
    const hoursByMonth = months.map(m => ({
      label: format(m, 'MMM'),
      value: invoices.filter(i => isSameMonth(parseISO(i.issued_at), m)).reduce((s, i) => s + i.total_hours, 0),
    }));

    // Collection efficiency
    const totalIssued = invoices.reduce((s, i) => s + i.total_amount, 0);
    const totalCollected = paid.reduce((s, i) => s + i.total_amount, 0);
    const collectionRate = totalIssued > 0 ? (totalCollected / totalIssued) * 100 : 0;

    // This month vs last month
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const thisMonthRevenue = paid.filter(i => isSameMonth(parseISO(i.issued_at), thisMonth)).reduce((s, i) => s + i.total_amount, 0);
    const lastMonthRevenue = paid.filter(i => isSameMonth(parseISO(i.issued_at), lastMonth)).reduce((s, i) => s + i.total_amount, 0);
    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : null;

    // Avg invoice value
    const avgInvoiceValue = invoices.length ? invoices.reduce((s, i) => s + i.total_amount, 0) / invoices.length : 0;

    // Highest single invoice
    const topInvoice = invoices.reduce<InvoiceListItem | null>((top, i) => (!top || i.total_amount > top.total_amount) ? i : top, null);

    return {
      revenueByMonth, invoicesByMonth, statusDist, maxCount,
      avgRate, minRate, maxRate, hoursByMonth,
      collectionRate, totalCollected, totalIssued,
      thisMonthRevenue, lastMonthRevenue, revenueGrowth,
      avgInvoiceValue, topInvoice,
      totalHours: invoices.reduce((s, i) => s + i.total_hours, 0),
      totalOutstanding: outstanding.reduce((s, i) => s + i.total_amount, 0),
    };
  }, [invoices, period]);

  if (loading) return (
    <div className="p-12 flex flex-col items-center gap-3 text-zinc-500">
      <svg className="animate-spin h-7 w-7 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm">Building report…</span>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'efficiency', label: 'Efficiency', icon: '⚡' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Finance Reports</h2>
          <p className="mt-1 text-sm text-zinc-500">Analytics, trends, and performance metrics across all invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(Number(e.target.value))}
            className="text-sm border border-zinc-200 rounded-lg px-3 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <Link href="/dashboard/finance/billing" className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Billing Summary
          </Link>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-4"><p className="text-sm text-red-800">{error}</p></div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ---- OVERVIEW TAB ---- */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon="💰" title="Total Revenue (Paid)" value={fmt(report.totalCollected)}
              sub={`of ${fmt(report.totalIssued)} total issued`}
              delta={report.revenueGrowth ? `${Math.abs(Number(report.revenueGrowth))}% MoM` : undefined}
              deltaPos={Number(report.revenueGrowth) >= 0}
              accent="bg-emerald-50 text-emerald-600 ring-emerald-200" />
            <MetricCard icon="⏳" title="Outstanding Balance" value={fmt(report.totalOutstanding)}
              sub="Sent + payment pending invoices"
              accent="bg-orange-50 text-orange-600 ring-orange-200" />
            <MetricCard icon="📄" title="Total Invoices" value={String(invoices.length)}
              sub={`${stats?.paid_invoices ?? 0} paid · ${stats?.draft_invoices ?? 0} draft`}
              accent="bg-indigo-50 text-indigo-600 ring-indigo-200" />
            <MetricCard icon="⚡" title="Collection Rate" value={`${report.collectionRate.toFixed(1)}%`}
              sub="Paid / total issued"
              accent="bg-violet-50 text-violet-600 ring-violet-200" />
          </div>

          {/* Revenue trend + status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Revenue Trend</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Paid revenue by month</p>
                </div>
                <p className="text-lg font-bold text-emerald-600">{fmt(report.thisMonthRevenue)}<span className="text-xs font-normal text-zinc-400 ml-1">this month</span></p>
              </div>
              {invoices.length === 0
                ? <div className="h-28 flex items-center justify-center text-sm text-zinc-400">No invoice data yet.</div>
                : <AreaChart bars={report.revenueByMonth} />
              }
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Status Distribution</h3>
              <div className="space-y-3">
                {report.statusDist.length === 0
                  ? <p className="text-sm text-zinc-400">No invoices yet.</p>
                  : report.statusDist.map(s => (
                    <HBar
                      key={s.status}
                      label={STATUS_LABELS[s.status] ?? s.status}
                      value={s.count}
                      max={report.maxCount}
                      color={STATUS_COLORS[s.status] ?? '#a1a1aa'}
                      amount={fmt(s.amount)}
                    />
                  ))
                }
              </div>
            </div>
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <p className="text-xs text-zinc-500 font-medium">Avg Invoice Value</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{fmtFull(report.avgInvoiceValue)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <p className="text-xs text-zinc-500 font-medium">Avg Hourly Rate</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">${report.avgRate.toFixed(2)}/h</p>
              <p className="text-xs text-zinc-400 mt-0.5">Range: ${report.minRate.toFixed(0)} – ${report.maxRate.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <p className="text-xs text-zinc-500 font-medium">Total Billed Hours</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{report.totalHours.toLocaleString()}h</p>
              <p className="text-xs text-zinc-400 mt-0.5">Across {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- REVENUE TAB ---- */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Monthly Revenue (Paid Invoices)</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Area chart — current month highlighted</p>
              </div>
            </div>
            {invoices.length === 0
              ? <div className="h-36 flex items-center justify-center text-sm text-zinc-400">No invoice data yet.</div>
              : <AreaChart bars={report.revenueByMonth} />
            }
          </div>

          {/* Month-by-month table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900">Monthly Revenue Breakdown</h3>
            </div>
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Month</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoices Issued</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoices Paid</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Revenue Collected</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Hours Billed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {report.revenueByMonth.map((m, i) => {
                  const row = report.invoicesByMonth[i];
                  const hrs = report.hoursByMonth[i];
                  return (
                    <tr key={m.label} className={`${m.current ? 'bg-indigo-50/50' : i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/40'} hover:bg-indigo-50/30`}>
                      <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900">
                        {m.label} {m.current && <span className="ml-1 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Current</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600 text-right">{row?.count ?? 0}</td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600 text-right">{row?.paid ?? 0}</td>
                      <td className={`px-5 py-3.5 text-sm font-bold text-right ${m.value > 0 ? 'text-emerald-700' : 'text-zinc-400'}`}>
                        {m.value > 0 ? fmtFull(m.value) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600 text-right">{hrs?.value > 0 ? `${hrs.value}h` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-900">
                  <td className="px-5 py-3 text-sm font-bold text-white">Total</td>
                  <td className="px-5 py-3 text-sm font-bold text-white text-right">{report.invoicesByMonth.reduce((s, m) => s + m.count, 0)}</td>
                  <td className="px-5 py-3 text-sm font-bold text-white text-right">{report.invoicesByMonth.reduce((s, m) => s + m.paid, 0)}</td>
                  <td className="px-5 py-3 text-sm font-bold text-emerald-400 text-right">{fmtFull(report.revenueByMonth.reduce((s, m) => s + m.value, 0))}</td>
                  <td className="px-5 py-3 text-sm font-bold text-white text-right">{report.hoursByMonth.reduce((s, m) => s + m.value, 0)}h</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ---- INVOICES TAB ---- */}
      {tab === 'invoices' && (
        <div className="space-y-6">
          {/* Status cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { status: 'draft', label: 'Draft', count: stats?.draft_invoices ?? 0, icon: '📝' },
              { status: 'ready', label: 'Ready', count: stats?.ready_invoices ?? 0, icon: '✅' },
              { status: 'sent', label: 'Sent', count: stats?.sent_invoices ?? 0, icon: '📤' },
              { status: 'payment_pending', label: 'Pending', count: invoices.filter(i => i.status === 'payment_pending').length, icon: '⏳' },
              { status: 'paid', label: 'Paid', count: stats?.paid_invoices ?? 0, icon: '💳' },
            ].map(s => (
              <div key={s.status} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-3xl font-black text-zinc-900">{s.count}</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
                <div className="mt-2 h-1 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
              </div>
            ))}
          </div>

          {/* Invoice value distribution */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Invoice Amount by Status</h3>
            <div className="space-y-3">
              {report.statusDist.map(s => (
                <div key={s.status} className="flex items-center gap-4">
                  <span className="w-28 text-xs font-medium text-zinc-700 flex-shrink-0">{STATUS_LABELS[s.status]}</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full" style={{
                      width: report.totalIssued > 0 ? `${(s.amount / report.totalIssued) * 100}%` : '0',
                      background: STATUS_COLORS[s.status]
                    }} />
                  </div>
                  <span className="w-24 text-right text-sm font-bold text-zinc-900 flex-shrink-0">{fmtFull(s.amount)}</span>
                  <span className="w-12 text-right text-xs text-zinc-400 flex-shrink-0">{pct(s.amount, report.totalIssued)}</span>
                </div>
              ))}
              {report.statusDist.length === 0 && <p className="text-sm text-zinc-400">No invoices yet.</p>}
            </div>
          </div>

          {/* Top invoice */}
          {report.topInvoice && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Highest Value Invoice</h3>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xl font-black text-zinc-900">{report.topInvoice.invoice_number}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {format(parseISO(report.topInvoice.period_start_date), 'MMM d')} – {format(parseISO(report.topInvoice.period_end_date), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{report.topInvoice.total_hours}h @ ${report.topInvoice.hourly_rate.toFixed(2)}/h</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-indigo-700">{fmtFull(report.topInvoice.total_amount)}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                    report.topInvoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                    'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200'
                  }`}>{STATUS_LABELS[report.topInvoice.status]}</span>
                </div>
                <Link href={`/dashboard/finance/invoices/${report.topInvoice.id}`}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                  View Invoice
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- EFFICIENCY TAB ---- */}
      {tab === 'efficiency' && (
        <div className="space-y-6">
          {/* Collection efficiency gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-6">Collection Efficiency</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500">Collected</span>
                <span className="text-xs font-bold text-zinc-900">{report.collectionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-4 overflow-hidden mb-3">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000"
                  style={{ width: `${Math.min(report.collectionRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Collected: <strong className="text-emerald-700">{fmt(report.totalCollected)}</strong></span>
                <span>Total Issued: <strong className="text-zinc-700">{fmt(report.totalIssued)}</strong></span>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs text-zinc-500">Outstanding (uncollected)</p>
                <p className="text-xl font-bold text-orange-600 mt-1">{fmt(report.totalIssued - report.totalCollected)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Rate Analytics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Average Rate', value: `$${report.avgRate.toFixed(2)}/h`, color: 'text-indigo-700' },
                  { label: 'Minimum Rate', value: `$${report.minRate.toFixed(2)}/h`, color: 'text-zinc-700' },
                  { label: 'Maximum Rate', value: `$${report.maxRate.toFixed(2)}/h`, color: 'text-emerald-700' },
                  { label: 'Avg Invoice Value', value: fmtFull(report.avgInvoiceValue), color: 'text-violet-700' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                    <span className="text-sm text-zinc-500">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hours by month */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-5">Billed Hours by Month</h3>
            <div className="flex items-end gap-3 h-32">
              {report.hoursByMonth.map((m, i) => {
                const maxH = Math.max(...report.hoursByMonth.map(h => h.value), 1);
                const pctH = (m.value / maxH) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 gap-1">
                    <span className="text-xs font-semibold text-zinc-700">{m.value > 0 ? `${m.value}h` : ''}</span>
                    <div className="w-full flex items-end" style={{ height: '90px' }}>
                      <div className="w-full rounded-t-md bg-indigo-400 hover:bg-indigo-600 transition-colors"
                        style={{ height: `${pctH}%`, minHeight: m.value > 0 ? '4px' : '0' }} />
                    </div>
                    <span className="text-xs text-zinc-500">{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex gap-8 text-sm">
              <div>
                <p className="text-xs text-zinc-400">Total Hours Billed</p>
                <p className="text-lg font-bold text-indigo-700">{report.totalHours.toLocaleString()}h</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Effective Revenue/Hour</p>
                <p className="text-lg font-bold text-emerald-700">
                  {report.totalHours > 0 ? `$${(report.totalCollected / report.totalHours).toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Pending validation + queue health */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Queue Health</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Awaiting Validation', value: stats?.pending_validation ?? 0, icon: '🔍', cls: 'text-amber-700 bg-amber-50 ring-amber-200' },
                { label: 'Draft Invoices', value: stats?.draft_invoices ?? 0, icon: '📝', cls: 'text-zinc-700 bg-zinc-100 ring-zinc-200' },
                { label: 'Ready to Send', value: stats?.ready_invoices ?? 0, icon: '✅', cls: 'text-blue-700 bg-blue-50 ring-blue-200' },
                { label: 'Pending Payment', value: invoices.filter(i => i.status === 'payment_pending').length, icon: '⏳', cls: 'text-orange-700 bg-orange-50 ring-orange-200' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-zinc-100 p-4 text-center">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 text-xl mx-auto ${item.cls}`}>{item.icon}</div>
                  <p className="text-2xl font-bold text-zinc-900 mt-2">{item.value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
