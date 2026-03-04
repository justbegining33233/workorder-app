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
  { title: "Live dispatch",       detail: "Real-time routing with SLA alerts and location context." },
  { title: "Approval flows",      detail: "Auto-send estimates with e-signature capture." },
  { title: "Parts & inventory",   detail: "Track parts usage, reorder points, and vendor SLAs." },
  { title: "Technician pulse",    detail: "Know where every tech is and what they need next." },
  { title: "Customer timeline",   detail: "Share a branded status page for every job." },
  { title: "Analytics board",     detail: "Measure cycle time, margin, and repeat work." },
];

const testimonials = [
  { quote: "FixTray gave us a single source of truth. Dispatch runs like a studio control room now.", name: "Lena Alvarez",  role: "Operations Lead" },
  { quote: "We finally have approvals that don\u2019t stall out. It\u2019s our competitive edge.",    name: "Grant Hill",   role: "Service Manager" },
  { quote: "Customers love the live timeline. It reduced call volume overnight.",                     name: "Shay Patel",   role: "Customer Experience" },
];

export default function Home() {
  return (
    <MarketingShell>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="mx-auto flex min-h-[72vh] max-w-4xl flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em]"
          style={neonBadge}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          Auto Repair Management Platform
        </div>

        <h1 className="mt-8 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          The command center for{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
            modern work orders
          </span>
          .
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
          Align operations, approvals, and customer updates with one cinematic workflow that feels fast, calm, and always connected.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link href="/auth/login" className="rounded-full px-7 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90" style={primaryBtn}>
            Start free
          </Link>
          <Link href="/auth/login" className="rounded-full px-7 py-3 text-sm font-semibold shadow-sm transition hover:border-slate-400" style={ghostBtn}>
            Book a demo
          </Link>
        </div>

        <div className="mt-14 grid w-full grid-cols-3 gap-4">
          {[
            { label: "Faster approvals", value: "52%" },
            { label: "Fewer follow-ups",  value: "3.1×" },
            { label: "Live visibility",   value: "24/7" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-6 py-5">
              <p className="text-2xl font-semibold text-white">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OPERATIONS ─────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Operations, synchronized</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Run every job like a mission.</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            FixTray stitches together your intake, dispatch, approvals, and completions with a live status ribbon that keeps every role in sync.
          </p>
          <ul className="mt-6 space-y-4">
            {[
              "Auto-route work orders to the right tech",
              "Instant approvals from any device",
              "Customer-ready updates without the call volume",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl p-6" style={glassCard}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status ribbon</p>
            <p className="mt-4 text-lg font-semibold text-white">Every job, every handoff, in one view.</p>
            <div className="mt-6 grid gap-3">
              {[
                { label: "Awaiting approval", value: "12" },
                { label: "In progress",       value: "38" },
                { label: "Completed today",   value: "26" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3">
                  <span className="text-sm text-slate-200">{row.label}</span>
                  <span className="text-sm font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-6 py-5">
            <p className="text-sm italic text-slate-300">
              &ldquo;We cut approval time in half and customers stopped calling for status updates.&rdquo;
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">Ops Director &middot; Multi-shop fleet</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Features</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Built for relentless teams.</h2>
          </div>
          <Link href="#" className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
            Explore all features →
          </Link>
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

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 px-8 py-10">
          <div className="grid gap-10 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name}>
                <p className="text-sm italic leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">
                  {t.name} &middot; {t.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-pink-500/10 px-10 py-12">
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Ready to launch</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Make every work order feel effortless.</h3>
              <p className="mt-2 text-sm text-slate-300">Start in minutes or book a custom onboarding session.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/login" className="rounded-full px-7 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90" style={primaryBtn}>
                Start free
              </Link>
              <Link href="/contact" className="rounded-full px-7 py-3 text-sm font-semibold shadow-sm transition hover:border-slate-400" style={ghostBtn}>
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}

  dashboard: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  wrench: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  users: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  chart: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <polyline strokeLinecap="round" strokeLinejoin="round" points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  shield: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  phone: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" strokeWidth={2.5} />
    </svg>
  ),
};

const features = [
  {
    icon: icons.dashboard,
    color: "from-cyan-400 to-blue-500",
    glow: "group-hover:shadow-cyan-500/20",
    title: "Real-Time Dashboards",
    description: "Every role gets a purpose-built dashboard — live revenue, job queues, team status, and alerts, all in one view.",
  },
  {
    icon: icons.wrench,
    color: "from-indigo-400 to-violet-500",
    glow: "group-hover:shadow-indigo-500/20",
    title: "Work Order Engine",
    description: "Create, dispatch, and close work orders in seconds. Bay assignment, road calls, and digital authorizations built in.",
  },
  {
    icon: icons.users,
    color: "from-pink-400 to-rose-500",
    glow: "group-hover:shadow-pink-500/20",
    title: "Customer Portal",
    description: "Live tech tracking, two-way messaging, loyalty rewards, service history, and invoice payments — all customer-facing.",
  },
  {
    icon: icons.chart,
    color: "from-emerald-400 to-teal-500",
    glow: "group-hover:shadow-emerald-500/20",
    title: "Inventory & Financials",
    description: "Parts catalog, purchase orders, payroll, AR aging, profit margins, and vendor management from one place.",
  },
  {
    icon: icons.shield,
    color: "from-amber-400 to-orange-500",
    glow: "group-hover:shadow-amber-500/20",
    title: "Security & Compliance",
    description: "Role-based access control, full audit logs, session monitoring, 2FA enforcement, and one-click backup restore.",
  },
  {
    icon: icons.phone,
    color: "from-sky-400 to-cyan-500",
    glow: "group-hover:shadow-sky-500/20",
    title: "Mobile-First Field Tools",
    description: "Techs share live GPS, upload photos, run diagnostics, pull OBD codes, and clock in — all from their phone.",
  },
];

const roles = [
  {
    key: "admin",
    badge: "AD",
    badgeColor: "from-rose-400 to-pink-600",
    label: "Admin & Superadmin",
    tagline: "Full platform command.",
    bullets: [
      "Approve & manage all shop accounts",
      "Platform-wide analytics & financial reports",
      "User, tenant & subscription management",
      "Email templates, coupons & system config",
      "Backup/restore, security settings & audit logs",
    ],
  },
  {
    key: "shop",
    badge: "SH",
    badgeColor: "from-cyan-400 to-indigo-500",
    label: "Shop Owner",
    tagline: "Total shop control.",
    bullets: [
      "Live ops dashboard with bay dispatch",
      "Team management & payroll",
      "Inventory, purchase orders & vendor portal",
      "DVI, condition reports & work authorizations",
      "Branding, integrations & multi-location support",
    ],
  },
  {
    key: "manager",
    badge: "MG",
    badgeColor: "from-violet-400 to-purple-600",
    label: "Manager",
    tagline: "Day-to-day oversight.",
    bullets: [
      "Assign and track all work orders",
      "Team performance monitoring",
      "Inventory requests with urgency tiers",
      "Financial summary & schedule overview",
      "Time clock and internal messaging",
    ],
  },
  {
    key: "tech",
    badge: "TC",
    badgeColor: "from-emerald-400 to-teal-600",
    label: "Technician",
    tagline: "Field-ready power tools.",
    bullets: [
      "Create roadside & in-shop jobs on the go",
      "Live GPS sharing with customers",
      "DVI, diagnostics & DTC lookup",
      "Photo uploads & service manual library",
      "Timesheet, messaging & parts inventory",
    ],
  },
  {
    key: "customer",
    badge: "CX",
    badgeColor: "from-amber-400 to-orange-500",
    label: "Customer",
    tagline: "Transparent, effortless service.",
    bullets: [
      "Book appointments & approve estimates",
      "Live tech GPS tracking in real time",
      "Two-way messaging with assigned tech",
      "Full service history & document vault",
      "Loyalty rewards, payments & recurring approvals",
    ],
  },
];

const stats = [
  { value: "5", label: "User Roles" },
  { value: "40+", label: "Shop Tools" },
  { value: "100%", label: "Live Data" },
  { value: "Real-Time", label: "Messaging" },
];

export default function Home() {
  const [openRole, setOpenRole] = useState<string>("shop");

  return (
    <MarketingShell>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-28 pt-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-cyan-500/10 blur-[100px]" />
          <div className="absolute right-[-8%] top-24 h-72 w-72 rounded-full bg-pink-500/10 blur-[80px]" />
          <div className="absolute bottom-0 left-[-5%] h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Auto Repair Management Platform
          </span>

          <h1 className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Run Your Shop.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #22d3ee, #818cf8, #f472b6)" }}
            >
              Own the Experience.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            FixTray is the all-in-one operating system for auto repair shops — from bay dispatch and DVI to customer tracking and loyalty rewards.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/login"
              className="rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.03] hover:shadow-cyan-500/50"
              style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #6366f1, #ec4899)" }}
            >
              Get Started Free
            </Link>
            <Link
              href="#features"
              className="rounded-full border border-slate-600 bg-slate-800/60 px-8 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-slate-400 hover:text-white"
            >
              See Features →
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-700/60 bg-slate-800/50 px-4 py-5 backdrop-blur"
              >
                <p
                  className="bg-clip-text text-2xl font-extrabold text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #818cf8)" }}
                >
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="relative px-6 py-24">
        <div className="pointer-events-none absolute inset-0 bg-slate-900/40" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Platform</p>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything you need, nothing you don&apos;t.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-slate-400">
            Built for shop owners who want to stop juggling tools and start running a tight operation.
          </p>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-slate-500/60 hover:shadow-xl ${f.glow}`}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white ${f.color}`}
                >
                  {f.icon}
                </div>
                <h4 className="mb-2 text-base font-bold text-white">{f.title}</h4>
                <p className="text-sm leading-relaxed text-slate-400">{f.description}</p>
                <div
                  className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30 ${f.color}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ────────────────────────────────────────────────────── */}
      <section id="roles" className="relative overflow-hidden px-6 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-indigo-600/8 blur-[100px]" />
          <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-pink-600/8 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-pink-400">Roles</p>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Tailored for every person on your team.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-slate-400">
            One platform, five distinct role experiences — each purpose-built so nobody gets in everybody else&apos;s way.
          </p>

          <div className="mt-12 flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-row gap-2 overflow-x-auto pb-1 lg:w-52 lg:flex-col lg:overflow-visible lg:pb-0">
              {roles.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setOpenRole(r.key)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    openRole === r.key
                      ? "bg-slate-700/80 text-white shadow-inner"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white ${r.badgeColor}`}
                  >
                    {r.badge}
                  </span>
                  <span className="hidden sm:block lg:block">{r.label}</span>
                </button>
              ))}
            </div>

            {roles.filter((r) => r.key === openRole).map((r) => (
              <div
                key={r.key}
                className="flex-1 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-8 backdrop-blur"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-lg ${r.badgeColor}`}
                  >
                    {r.badge}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{r.label}</h3>
                    <p className="text-sm text-slate-400">{r.tagline}</p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-slate-300">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/login"
                  className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.03]"
                  style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #6366f1)" }}
                >
                  Get started as {r.label} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section id="signup" className="relative overflow-hidden px-6 py-28 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-pink-500/10" />
          <div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Ready?</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Transform how your shop works.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-slate-400">
            Join auto repair shops already running tighter operations, happier teams, and more loyal customers on FixTray.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/login"
              className="rounded-full px-10 py-4 text-sm font-bold text-white shadow-xl shadow-cyan-500/30 transition hover:scale-[1.04] hover:shadow-cyan-500/50"
              style={{ backgroundImage: "linear-gradient(135deg, #22d3ee, #6366f1, #ec4899)" }}
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-slate-600 bg-slate-800/60 px-10 py-4 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-slate-400 hover:text-white"
            >
              View Pricing
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">No credit card required &nbsp;·&nbsp; Cancel any time</p>
        </div>
      </section>

    </MarketingShell>
  );
}