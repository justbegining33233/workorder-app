"use client";

import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";

const primaryBtn: React.CSSProperties = {
  background: "#e5332a",
  color: "#fff",
  boxShadow: "0 2px 18px rgba(229,51,42,0.45)",
};
const ghostBtn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.13)",
  background: "rgba(255,255,255,0.05)",
  color: "#f1f5f9",
  backdropFilter: "blur(10px)",
};
const glassCard: React.CSSProperties = {
  background: "rgba(8, 13, 26, 0.75)",
  backdropFilter: "blur(22px) saturate(1.5)",
  WebkitBackdropFilter: "blur(22px) saturate(1.5)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
};
const neonBadge: React.CSSProperties = {
  background: "rgba(229,51,42,0.14)",
  border: "1px solid rgba(229,51,42,0.28)",
  color: "#ffb3ad",
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
          <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#e5332a" }} />
          Auto Repair Management Platform
        </div>
        <h1 className="mt-8 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          The command center for{" "}
          <span style={{ background: "linear-gradient(90deg, #e5332a, #ff6b5e, #ff948d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            modern work orders
          </span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
          Align operations, approvals, and customer updates with one cinematic workflow that feels fast, calm, and always connected.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link href="/auth/login" className="rounded-xl px-7 py-3 text-sm font-semibold transition hover:opacity-90" style={primaryBtn}>Start free</Link>
          <Link href="/auth/login" className="rounded-xl px-7 py-3 text-sm font-semibold transition" style={ghostBtn}>Book a demo</Link>
        </div>
        <div className="mt-14 grid w-full grid-cols-3 gap-4">
          {[
            { label: "Faster approvals", value: "52%" },
            { label: "Fewer follow-ups",  value: "3.1x" },
            { label: "Live visibility",   value: "24/7" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl px-6 py-5" style={glassCard}>
              <p className="text-2xl font-semibold text-white">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.3em]" style={{ color: "#94a3b8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OPERATIONS */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 lg:grid-cols-2">
        <div className="flex flex-col justify-center lg:text-left text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: "#94a3b8" }}>Operations, synchronized</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Run every job like a mission.</h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "#cbd5e1" }}>
            FixTray stitches together your intake, dispatch, approvals, and completions with a live status ribbon that keeps every role in sync.
          </p>
          <ul className="mt-6 space-y-4">
            {["Auto-route work orders to the right tech", "Instant approvals from any device", "Customer-ready updates without the call volume"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#e2e8f0" }}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#e5332a" }} />{item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl p-6" style={glassCard}>
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "#94a3b8" }}>Status ribbon</p>
            <p className="mt-4 text-lg font-semibold text-white">Every job, every handoff, in one view.</p>
            <div className="mt-6 grid gap-3">
              {[{ label: "Awaiting approval", value: "12" }, { label: "In progress", value: "38" }, { label: "Completed today", value: "26" }].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-sm" style={{ color: "#e2e8f0" }}>{row.label}</span>
                  <span className="text-sm font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl px-6 py-5" style={{ background: "rgba(8,13,26,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-sm italic" style={{ color: "#cbd5e1" }}>&ldquo;We cut approval time in half and customers stopped calling for status updates.&rdquo;</p>
            <p className="mt-3 text-xs uppercase tracking-[0.3em]" style={{ color: "#64748b" }}>Ops Director &middot; Multi-shop fleet</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-col items-center text-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: "#94a3b8" }}>Features</p>
          <h2 className="text-3xl font-semibold text-white">Built for relentless teams.</h2>
          <Link href="#" className="text-sm font-semibold transition" style={{ color: "#ff948d" }} onMouseOver={e => (e.currentTarget.style.color = "#ffb3ad")} onMouseOut={e => (e.currentTarget.style.color = "#ff948d")}>Explore all features &rarr;</Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl p-6 transition hover:-translate-y-0.5" style={glassCard}>
              <p className="text-lg font-semibold text-white">{f.title}</p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl px-8 py-10" style={{ background: "rgba(8,13,26,0.75)", backdropFilter: "blur(22px) saturate(1.5)", WebkitBackdropFilter: "blur(22px) saturate(1.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="grid gap-10 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name}>
                <p className="text-sm italic leading-relaxed" style={{ color: "#cbd5e1" }}>&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-xs uppercase tracking-[0.3em]" style={{ color: "#64748b" }}>{t.name} &middot; {t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="rounded-2xl px-10 py-12" style={{ background: "rgba(229,51,42,0.08)", border: "1px solid rgba(229,51,42,0.22)", backdropFilter: "blur(22px) saturate(1.5)", WebkitBackdropFilter: "blur(22px) saturate(1.5)" }}>
          <div className="flex flex-col items-center text-center gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: "#94a3b8" }}>Ready to launch</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Make every work order feel effortless.</h3>
              <p className="mt-2 text-sm" style={{ color: "#cbd5e1" }}>Start in minutes or book a custom onboarding session.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/auth/login" className="rounded-xl px-7 py-3 text-sm font-semibold transition hover:opacity-90" style={primaryBtn}>Start free</Link>
              <Link href="/contact" className="rounded-xl px-7 py-3 text-sm font-semibold transition" style={ghostBtn}>Contact sales</Link>
            </div>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}
