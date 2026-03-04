"use client";

import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";

const primaryBtn: React.CSSProperties = {
  background: "linear-gradient(90deg, #22D3EE 0%, #6366F1 55%, #EC4899 100%)",
  color: "#fff",
  boxShadow: "0 18px 40px rgba(59,130,246,0.35)",
};
const ghostBtn: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,0.4)",
  background: "rgba(15,23,42,0.4)",
  color: "#E2E8F0",
  backdropFilter: "blur(10px)",
};
const glassCard: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(15,23,42,0.78) 0%, rgba(30,41,59,0.88) 100%)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 26,
  boxShadow: "0 30px 70px rgba(15,23,42,0.45)",
};
const neonBadge: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(34,211,238,0.15) 0%, rgba(236,72,153,0.15) 100%)",
  border: "1px solid rgba(236,72,153,0.3)",
  color: "#F8FAFC",
};

const features = [
  { title: "Live dispatch",     detail: "Real-time routing with SLA alerts and location context." },
  { title: "Approval flows",    detail: "Auto-send estimates with e-signature capture." },
  { title: "Parts & inventory", detail: "Track parts usage, reorder points, and vendor SLAs." },
  { title: "Technician pulse",  detail: "Know where every tech is and what they need next." },
  { title: "Customer timeline", detail: "Share a branded status page for every job." },
  { title: "Analytics board",   detail: "Measure cycle time, margin, and repeat work." },
];

const testimonials = [
  { quote: "FixTray gave us a single source of truth. Dispatch runs like a studio control room now.", name: "Lena Alvarez", role: "Operations Lead" },
  { quote: "We finally have approvals that don\u2019t stall out. It\u2019s our competitive edge.",    name: "Grant Hill",  role: "Service Manager" },
  { quote: "Customers love the live timeline. It reduced call volume overnight.",                     name: "Shay Patel",  role: "Customer Experience" },
];

export default function Home() {
  return (
    <MarketingShell>

      {/* HERO */}
      <section className="mx-auto flex min-h-[72vh] max-w-4xl flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em]" style={neonBadge}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          Auto Repair Management Platform
        </div>
        <h1 className="mt-8 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          The command center for{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
            modern work orders
          </span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
          Align operations, approvals, and customer updates with one cinematic workflow that feels fast, calm, and always connected.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link href="/auth/login" className="rounded-full px-7 py-3 text-sm font-semibold transition hover:opacity-90" style={primaryBtn}>Start free</Link>
          <Link href="/auth/login" className="rounded-full px-7 py-3 text-sm font-semibold transition hover:border-slate-400" style={ghostBtn}>Book a demo</Link>
        </div>
        <div className="mt-14 grid w-full grid-cols-3 gap-4">
          {[
            { label: "Faster approvals", value: "52%" },
            { label: "Fewer follow-ups",  value: "3.1x" },
            { label: "Live visibility",   value: "24/7" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-6 py-5">
              <p className="text-2xl font-semibold text-white">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OPERATIONS */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Operations, synchronized</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Run every job like a mission.</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            FixTray stitches together your intake, dispatch, approvals, and completions with a live status ribbon that keeps every role in sync.
          </p>
          <ul className="mt-6 space-y-4">
            {["Auto-route work orders to the right tech", "Instant approvals from any device", "Customer-ready updates without the call volume"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />{item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl p-6" style={glassCard}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status ribbon</p>
            <p className="mt-4 text-lg font-semibold text-white">Every job, every handoff, in one view.</p>
            <div className="mt-6 grid gap-3">
              {[{ label: "Awaiting approval", value: "12" }, { label: "In progress", value: "38" }, { label: "Completed today", value: "26" }].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3">
                  <span className="text-sm text-slate-200">{row.label}</span>
                  <span className="text-sm font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-6 py-5">
            <p className="text-sm italic text-slate-300">&ldquo;We cut approval time in half and customers stopped calling for status updates.&rdquo;</p>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">Ops Director &middot; Multi-shop fleet</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Features</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Built for relentless teams.</h2>
          </div>
          <Link href="#" className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">Explore all features &rarr;</Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl p-6 transition hover:-translate-y-0.5" style={glassCard}>
              <p className="text-lg font-semibold text-white">{f.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-8 py-10">
          <div className="grid gap-10 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name}>
                <p className="text-sm italic leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">{t.name} &middot; {t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-pink-500/10 px-10 py-12">
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Ready to launch</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Make every work order feel effortless.</h3>
              <p className="mt-2 text-sm text-slate-300">Start in minutes or book a custom onboarding session.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/login" className="rounded-full px-7 py-3 text-sm font-semibold transition hover:opacity-90" style={primaryBtn}>Start free</Link>
              <Link href="/contact" className="rounded-full px-7 py-3 text-sm font-semibold transition hover:border-slate-400" style={ghostBtn}>Contact sales</Link>
            </div>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}
