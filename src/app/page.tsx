"use client";

import Link from "next/link";
import { useState } from "react";
import MarketingShell from "@/components/MarketingShell";

const features = [
  { icon: "📊", title: "Comprehensive Dashboards", description: "Real-time insights into revenue, jobs, team performance, and more for every role." },
  { icon: "🔧", title: "Job Management", description: "Create, assign, and track work orders, inspections, and road calls efficiently." },
  { icon: "👥", title: "Customer Engagement", description: "Messaging, live tracking, reviews, and loyalty programs to keep customers happy." },
  { icon: "💼", title: "Inventory & Financials", description: "Manage parts, vendors, payroll, reports, and integrations seamlessly." },
  { icon: "🛡️", title: "Security & Admin Tools", description: "Role-based access, audits, backups, and customizable settings for peace of mind." },
  { icon: "📱", title: "Mobile-Friendly", description: "Techs and customers can access tools on-the-go with GPS, photos, and more." }
];

const roles = [
  { key: "admin", label: "Admin / Superadmin", description: "Oversee the entire platform with tools for user management, analytics, financial reports, and system settings. Manage shops, customers, and global configurations effortlessly." },
  { key: "shop", label: "Shop Owner", description: "Run your shop with dashboards for stats, bays, teams, and customers. Handle inventory, payroll, reports, integrations, and more to optimize operations." },
  { key: "manager", label: "Manager", description: "Focus on day-to-day ops with alerts, work orders, team performance, inventory requests, and financial summaries. Assign tasks and monitor schedules." },
  { key: "tech", label: "Technician", description: "Access tools for job creation, diagnostics, inspections, inventory lookup, manuals, messaging, and time tracking. Share locations and upload photos on the go." },
  { key: "customer", label: "Customer", description: "Book appointments, track techs live, chat, view history, manage payments, earn rewards, and access documents all in one place." }
];

export default function Home() {
  const [openRole, setOpenRole] = useState<string>("admin");

  return (
    <MarketingShell>
      {/* Hero */}
      <section
        className="py-24 text-center text-white"
        style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" }}
      >
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Welcome to FixTray</h1>
          <p className="mt-5 text-lg text-blue-100">
            The all-in-one platform for auto repair shops: Manage operations, teams, customers, and more with ease.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-900 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">Key Features</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-6 shadow-lg transition hover:border-blue-500/40"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h4 className="mb-2 text-lg font-semibold text-white">{f.title}</h4>
                <p className="text-sm text-slate-300">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">Tailored for Every Role</h2>
          <div className="divide-y divide-slate-700 overflow-hidden rounded-2xl border border-slate-700">
            {roles.map((role) => {
              const isOpen = openRole === role.key;
              return (
                <div key={role.key} className="bg-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setOpenRole(isOpen ? "" : role.key)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-semibold text-white transition hover:bg-slate-700/50 focus:outline-none"
                  >
                    <span>{role.label}</span>
                    <span className="ml-4 text-slate-400">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-700 px-6 py-4 text-sm text-slate-300">
                      {role.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="signup"
        className="py-20 text-center text-white"
        style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
      >
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to Transform Your Auto Repair Business?</h2>
          <p className="mt-4 text-lg text-green-100">Sign up today and experience the power of FixTray.</p>
          <Link
            href="/auth/login"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-green-700 shadow-lg transition hover:bg-green-50"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
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