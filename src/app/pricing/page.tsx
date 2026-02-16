"use client";

import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/subscription";

const planOrder: SubscriptionPlan[] = ["starter", "growth", "professional", "business", "enterprise"];

const planDescriptions: Record<SubscriptionPlan, string> = {
  starter: "Solo operators & very small shops",
  growth: "Small shops with 2–5 technicians",
  professional: "Established shops running payroll & inventory",
  business: "High-volume shops & multi-location operators",
  enterprise: "Franchises, fleets, and enterprise networks"
};

const planHighlights: Partial<Record<SubscriptionPlan, boolean>> = {
  professional: true
};

const planFeatureHighlights: Record<SubscriptionPlan, string[]> = {
  starter: ["Work order management", "Time tracking", "Basic reporting", "Email notifications"],
  growth: ["Multi-role users", "Photo capture", "Team messaging", "Real-time dashboards"],
  professional: ["Inventory management", "Payroll automation", "Advanced reporting", "Budget tracking"],
  business: ["Multi-shop management", "Revenue analytics", "Priority support", "Real-time dashboards"],
  enterprise: ["Custom integrations", "SLA guarantees", "White label", "API access"]
};

const formatPrice = (plan: SubscriptionPlan) => {
  const value = SUBSCRIPTION_PLANS[plan].price;
  return typeof value === "number" ? `$${value}` : String(value);
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Pricing</p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Plans that scale with every bay.</h1>
        <p className="mt-5 text-lg text-slate-300">Start lean, then turn on the full command center as you grow.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-5">
          {planOrder.map((planKey) => {
            const plan = SUBSCRIPTION_PLANS[planKey];
            const highlight = Boolean(planHighlights[planKey]);

            return (
            <div
              key={plan.name}
              className={`rounded-3xl border bg-slate-950/70 p-6 ${highlight ? "border-cyan-400/60 shadow-xl shadow-cyan-500/20" : "border-slate-800/70"}`}
            >
              {highlight && (
                <span className="inline-flex rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  Most popular
                </span>
              )}
              <h2 className="mt-4 text-xl font-semibold text-white">{plan.name}</h2>
              <p className="mt-2 text-3xl font-semibold text-white">{formatPrice(planKey)}</p>
              <p className="mt-2 text-sm text-slate-400">{planDescriptions[planKey]}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {planFeatureHighlights[planKey].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/login"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ${highlight ? "bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 text-white" : "border border-slate-700/70 text-slate-100"}`}
              >
                Choose {plan.name}
              </Link>
            </div>
          );
          })}
        </div>
      </section>
    </MarketingShell>
  );
}
