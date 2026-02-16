// SystemHealth.tsx - infra health cards with animated statuses
'use client';

import React from 'react';
import StatusBadge, { StatusTone } from './StatusBadge';
import Sparkline from './Sparkline';

interface HealthMetric {
  label: string;
  value: string;
  subtext: string;
  tone: StatusTone;
  trend: number[];
}

interface SystemHealthProps {
  metrics: HealthMetric[];
}

/**
 * Displays infra health metrics with subtle animation and sparklines, enhanced with glows.
 */
export default function SystemHealth({ metrics }: SystemHealthProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 shadow-xl shadow-black/40 relative overflow-hidden group hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-500">
      {/* Animated health glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">System Health</p>
          <h3 className="text-lg font-semibold text-white">Infra heartbeat and latency</h3>
        </div>
        <StatusBadge label="Monitoring" tone="info" pulse />
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/30 hover:shadow-xl hover:scale-105 transition-all duration-300 group/metric">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-200 font-semibold">{metric.label}</p>
              <StatusBadge label={metric.subtext} tone={metric.tone} size="sm" />
            </div>
            <p className="text-2xl font-semibold text-white leading-none mb-3 group-hover/metric:text-orange-300 transition-colors">{metric.value}</p>
            <div className="h-12 group-hover/metric:scale-110 transition-transform">
              <Sparkline data={metric.trend} color={metric.tone === 'danger' ? '#f43f5e' : metric.tone === 'warning' ? '#fbbf24' : metric.tone === 'info' ? '#38bdf8' : '#22c55e'} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
