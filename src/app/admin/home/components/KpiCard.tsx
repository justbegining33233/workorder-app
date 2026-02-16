// KpiCard.tsx - reusable KPI card with sparkline + delta
'use client';

import React from 'react';
import Sparkline from './Sparkline';

interface KpiCardProps {
  /** Label for the KPI */
  title: string;
  /** Main formatted value */
  value: string;
  /** Percentage or delta change text */
  change: string;
  /** Sparkline data series */
  trend: number[];
  /** Accent color key */
  accent?: 'emerald' | 'sky' | 'violet' | 'amber';
  /** Optional supporting text */
  caption?: string;
}

/**
 * KPI card showing value, change, and a sparkline trend with enhanced glow effects.
 */
export default function KpiCard({ title, value, change, trend, accent = 'emerald', caption }: KpiCardProps) {
  const palette: Record<string, { ring: string; text: string; chip: string; chipText: string; shadow: string; color: string; glow: string }> = {
    emerald: { ring: 'border-emerald-500/30', text: 'text-emerald-100', chip: 'bg-emerald-500/15', chipText: 'text-emerald-200', shadow: 'shadow-emerald-500/20', color: '#22c55e', glow: 'shadow-emerald-500/50' },
    sky: { ring: 'border-sky-500/30', text: 'text-sky-100', chip: 'bg-sky-500/15', chipText: 'text-sky-200', shadow: 'shadow-sky-500/20', color: '#38bdf8', glow: 'shadow-sky-500/50' },
    violet: { ring: 'border-violet-500/30', text: 'text-violet-100', chip: 'bg-violet-500/15', chipText: 'text-violet-200', shadow: 'shadow-violet-500/20', color: '#a855f7', glow: 'shadow-violet-500/50' },
    amber: { ring: 'border-amber-500/30', text: 'text-amber-100', chip: 'bg-amber-500/15', chipText: 'text-amber-200', shadow: 'shadow-amber-500/20', color: '#f59e0b', glow: 'shadow-amber-500/50' },
  };

  const tone = palette[accent];

  return (
    <div className={`rounded-2xl border ${tone.ring} bg-gradient-to-br from-slate-900/70 to-slate-900 p-4 shadow-lg ${tone.shadow} hover:${tone.glow} hover:scale-105 transition-all duration-300 group relative overflow-hidden`}>
      {/* Subtle glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${accent}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{title}</p>
          <p className="text-2xl font-semibold text-white leading-tight mt-1 group-hover:text-orange-300 transition-colors">{value}</p>
          <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs ${tone.chip} ${tone.chipText} group-hover:scale-110 transition-transform`}>
            <span aria-hidden>↗</span>
            <span>{change}</span>
          </span>
          {caption && <p className="text-[11px] text-slate-500 mt-2">{caption}</p>}
        </div>
        <div className="w-28 group-hover:scale-110 transition-transform">
          <Sparkline data={trend} color={tone.color} />
        </div>
      </div>
    </div>
  );
}
