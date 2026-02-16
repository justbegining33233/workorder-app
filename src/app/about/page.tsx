"use client";

import MarketingShell from "@/components/MarketingShell";

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">About</p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">We build the calm inside the chaos.</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          FixTray is a product studio obsessed with service workflows. We give fast-growing teams the visibility and confidence to run every job like a mission.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { title: "Mission", detail: "Empower service teams with real-time clarity and customer-ready experiences." },
            { title: "Vision", detail: "Every work order should feel effortless, no matter the scale." },
            { title: "Values", detail: "Craft, speed, and transparency in everything we ship." }
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6">
              <p className="text-lg font-semibold text-white">{item.title}</p>
              <p className="mt-3 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
          <h2 className="text-2xl font-semibold text-white">Our story</h2>
          <p className="mt-4 text-sm text-slate-300">
            FixTray started as an internal system for a multi-shop service group. The team wanted a unified command center for work orders, approvals, and customer updates. That system became FixTray — a platform built by operators for operators.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { year: "2022", detail: "First live deployment across 4 service bays." },
              { year: "2024", detail: "Launched multi-shop visibility and technician pulse." },
              { year: "2026", detail: "FixTray Control Room ships globally." }
            ].map((item) => (
              <div key={item.year} className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
                <p className="text-lg font-semibold text-white">{item.year}</p>
                <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
