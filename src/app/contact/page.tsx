"use client";

import MarketingShell from "@/components/MarketingShell";

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Contact</p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Let’s build your command center.</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          Tell us about your operation and we’ll tailor the rollout. Expect a response within one business day.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
            <h2 className="text-2xl font-semibold text-white">Contact details</h2>
            <ul className="mt-6 space-y-4 text-sm text-slate-300">
              <li><span className="text-slate-500">Email:</span> team@fixtray.com</li>
              <li><span className="text-slate-500">Phone:</span> +1 (555) 013-4827</li>
              <li><span className="text-slate-500">Availability:</span> Mon–Fri, 8am–6pm</li>
            </ul>
          </div>
          <form className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8">
            <div className="grid gap-4">
              <input
                className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500"
                placeholder="Full name"
              />
              <input
                className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500"
                placeholder="Work email"
                type="email"
              />
              <input
                className="w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500"
                placeholder="Company"
              />
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500"
                placeholder="Tell us about your operation"
              />
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </section>
    </MarketingShell>
  );
}
