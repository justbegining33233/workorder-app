"use client";

import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/subscription";
import {
  PLAN_AUDIENCE,
  PLAN_MARKETING_HIGHLIGHTS,
  PLAN_ORDER,
  PLAN_SUMMARY,
  getPlanCapacityLine,
} from "@/lib/subscription-copy";

const planHighlights: Partial<Record<SubscriptionPlan, boolean>> = {
  professional: true
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
        <p className="mt-5 text-lg text-slate-300">From solo operators to multi-shop groups, every tier maps to a real operating model instead of a stripped-down teaser.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-5">
          {PLAN_ORDER.map((planKey) => {
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
              <p className="mt-2 text-sm text-slate-300">{PLAN_AUDIENCE[planKey]}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{getPlanCapacityLine(planKey)}</p>
              <p className="mt-3 text-sm text-slate-400">{PLAN_SUMMARY[planKey]}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {PLAN_MARKETING_HIGHLIGHTS[planKey].map((feature) => (
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
