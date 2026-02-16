"use client";

import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";

export default function Home() {
  const primaryButtonStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, #22D3EE 0%, #6366F1 55%, #EC4899 100%)",
    color: "#FFFFFF",
    boxShadow: "0 18px 40px rgba(59,130,246,0.35)"
  };
  const ghostButtonStyle: React.CSSProperties = {
    border: "1px solid rgba(148,163,184,0.4)",
    background: "rgba(15,23,42,0.4)",
    color: "#E2E8F0",
    backdropFilter: "blur(10px)"
  };
  const glassCardStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(15,23,42,0.78) 0%, rgba(30,41,59,0.88) 100%)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 26,
    boxShadow: "0 30px 70px rgba(15, 23, 42, 0.45)"
  };
  const neonBadgeStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, rgba(34,211,238,0.2) 0%, rgba(236,72,153,0.2) 100%)",
    border: "1px solid rgba(236,72,153,0.35)",
    color: "#F8FAFC"
  };

  return (
    <MarketingShell>
      <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em]" style={neonBadgeStyle}>
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          FixTray Control Room
        </div>
        <h1 className="mt-8 text-4xl font-semibold leading-tight sm:text-6xl">
          The command center for <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">modern work orders</span>.
        </h1>
        <p className="mt-5 text-lg text-slate-300">
          Align operations, approvals, and customer updates with one cinematic workflow that feels fast, calm, and always connected.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link href="/auth/login" className="rounded-full px-6 py-3 text-sm font-semibold shadow-sm" style={primaryButtonStyle}>
            Start free
          </Link>
          <Link href="/auth/login" className="rounded-full px-6 py-3 text-sm font-semibold shadow-sm" style={ghostButtonStyle}>
            Book a demo
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Faster approvals", value: "52%" },
            { label: "Fewer follow-ups", value: "3.1x" },
            { label: "Live visibility", value: "24/7" }
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-6 py-5">
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Operations, synchronized</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Run every job like a mission.</h2>
          <p className="mt-4 text-base text-slate-300">
            FixTray stitches together your intake, dispatch, approvals, and completions with a live status ribbon that keeps every role in sync.
          </p>
          <div className="mt-6 space-y-4">
            {[
              "Auto-route work orders to the right tech",
              "Instant approvals from any device",
              "Customer-ready updates without the call volume"
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl p-6" style={glassCardStyle}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status ribbon</p>
            <p className="mt-4 text-lg font-semibold text-white">Every job, every handoff, in one view.</p>
            <div className="mt-6 grid gap-3">
              {[
                { label: "Awaiting approval", value: "12" },
                { label: "In progress", value: "38" },
                { label: "Completed today", value: "26" }
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3">
                  <span className="text-sm text-slate-200">{row.label}</span>
                  <span className="text-sm font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-6 py-5">
            <p className="text-sm text-slate-300">“We cut approval time in half and customers stopped calling for status updates.”</p>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">Ops Director, Multi-shop fleet</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Features</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Built for relentless teams.</h2>
          </div>
          <Link href="/features" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            Explore all features →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Live dispatch", detail: "Real-time routing with SLA alerts and location context." },
            { title: "Approval flows", detail: "Auto-send estimates with e-signature capture." },
            { title: "Parts & inventory", detail: "Track parts usage, reorder points, and vendor SLAs." },
            { title: "Technician pulse", detail: "Know where every tech is, and what they need next." },
            { title: "Customer timeline", detail: "Share a branded status page for every job." },
            { title: "Analytics board", detail: "Measure cycle time, margin, and repeat work." }
          ].map((item) => (
            <div key={item.title} className="rounded-3xl p-6" style={glassCardStyle}>
              <p className="text-lg font-semibold text-white">{item.title}</p>
              <p className="mt-3 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-8 py-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                quote: "FixTray gave us a single source of truth. Dispatch runs like a studio control room now.",
                name: "Lena Alvarez",
                role: "Operations Lead"
              },
              {
                quote: "We finally have approvals that don’t stall out. It’s our competitive edge.",
                name: "Grant Hill",
                role: "Service Manager"
              },
              {
                quote: "Customers love the live timeline. It reduced call volume overnight.",
                name: "Shay Patel",
                role: "Customer Experience"
              }
            ].map((testimonial) => (
              <div key={testimonial.name}>
                <p className="text-sm text-slate-300">“{testimonial.quote}”</p>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">{testimonial.name} · {testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-pink-500/10 px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Ready to launch</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Make every work order feel effortless.</h3>
              <p className="mt-2 text-sm text-slate-300">Start in minutes or book a custom onboarding session.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/login" className="rounded-full px-6 py-3 text-sm font-semibold shadow-sm" style={primaryButtonStyle}>
                Start free
              </Link>
              <Link href="/contact" className="rounded-full px-6 py-3 text-sm font-semibold shadow-sm" style={ghostButtonStyle}>
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}