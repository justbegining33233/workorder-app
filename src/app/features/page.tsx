"use client";

import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";

export default function FeaturesPage() {
  const glassCardStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(15,23,42,0.78) 0%, rgba(30,41,59,0.88) 100%)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 26,
    boxShadow: "0 30px 70px rgba(15, 23, 42, 0.45)"
  };

  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Features</p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
          The full stack for world-class work orders.
        </h1>
        <p className="mt-5 mx-auto max-w-2xl text-lg text-slate-300">
          FixTray blends dispatch, approvals, and customer visibility into one cinematic workflow.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/auth/login" className="rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30">
            Start free
          </Link>
          <Link href="/pricing" className="rounded-full border border-slate-700/70 bg-slate-950/60 px-6 py-3 text-sm font-semibold text-slate-200">
            View pricing
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 text-center">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Control center", detail: "A real-time work order wall with status ribbons and SLA visibility." },
            { title: "Smart dispatch", detail: "Auto-route work by skill, proximity, and priority." },
            { title: "Approval engine", detail: "Instant estimates, e-signatures, and customer-ready approvals." },
            { title: "Mobile tech suite", detail: "Offline-first mobile workflows, photos, and time tracking." },
            { title: "Customer timeline", detail: "Share progress updates with live ETAs and branded portals." },
            { title: "Revenue analytics", detail: "Track margin, cycle time, and technician performance." }
          ].map((item) => (
            <div key={item.title} className="rounded-3xl p-6 text-center" style={glassCardStyle}>
              <p className="text-lg font-semibold text-white">{item.title}</p>
              <p className="mt-3 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 text-center">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Automation</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Let the workflow run itself.</h2>
            <p className="mt-4 text-sm text-slate-300">
              Trigger tasks, approvals, and customer updates automatically when a job hits each milestone.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {[
                "SLA alerts and escalation paths",
                "Auto-generated estimates and invoices",
                "Customer SMS and email sequences"
              ].map((item) => (
                <li key={item} className="flex items-center justify-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mobile first</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Technicians stay in flow.</h2>
            <p className="mt-4 text-sm text-slate-300">
              Mobile checklists, photo capture, and voice notes keep field teams moving fast without paperwork.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {[
                "Offline capture and sync",
                "Photo + signature capture",
                "Live routing + turn-by-turn"
              ].map((item) => (
                <li key={item} className="flex items-center justify-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-pink-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
