'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface FinanceTrendDataPoint {
  date: string;
  draft: number;
  sent: number;
  paid: number;
}

interface FinanceTrendChartProps {
  title?: string;
  data?: FinanceTrendDataPoint[];
}

export default function FinanceTrendChart({ title = 'Invoicing Trend', data = [] }: FinanceTrendChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[15px] font-bold text-zinc-900">{title}</h3>
        <select className="text-[11px] font-bold text-zinc-600 bg-white border border-zinc-200 rounded-md px-2 py-1 outline-none">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-sm bg-zinc-400" />
          <span className="text-[10px] font-bold text-zinc-600 tracking-wide">Draft / Ready</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-sm bg-indigo-500" />
          <span className="text-[10px] font-bold text-zinc-600 tracking-wide">Sent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />
          <span className="text-[10px] font-bold text-zinc-600 tracking-wide">Paid</span>
        </div>
      </div>
      
      {/* Chart */}
      <div className="relative h-[220px] w-full mt-4 -ml-4">
        {data.length === 0 ? (
           <div className="flex items-center justify-center h-full text-zinc-400 text-xs pl-4">No trend data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#a1a1aa' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#a1a1aa' }} 
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="draft" stroke="#a1a1aa" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: '#a1a1aa' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: '#6366f1' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: '#10b981' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
