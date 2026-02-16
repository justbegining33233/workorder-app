"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

interface MarketingShellProps {
  children: ReactNode;
}

export default function MarketingShell({ children }: MarketingShellProps) {
  const pageStyle: React.CSSProperties = {
    background:
      "radial-gradient(circle at 15% 10%, rgba(56,189,248,0.22), transparent 40%), radial-gradient(circle at 85% 5%, rgba(244,114,182,0.2), transparent 45%), radial-gradient(circle at 70% 90%, rgba(34,211,238,0.18), transparent 50%), linear-gradient(180deg, #070B14 0%, #0F172A 50%, #111827 100%)",
    fontFamily: '"Sora", "Plus Jakarta Sans", "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
  };

  return (
    <div className="min-h-screen text-slate-100" style={pageStyle}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-24 right-[-10%] h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-slate-800/70 bg-slate-950/60 backdrop-blur">
        <div className="marketing-shift mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-5 text-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-pink-500 text-white shadow-lg shadow-cyan-500/30">
              <span className="text-sm font-semibold">FT</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-100 tracking-wide">FixTray</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workflows</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-300">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-center gap-3 text-sm">
            <Link href="/auth/login" className="text-slate-300 hover:text-white">
              Log in
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 px-4 py-2 font-semibold text-white shadow-lg shadow-cyan-500/30"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <div className="marketing-shift">{children}</div>
      </main>

      <footer className="relative z-10 border-t border-slate-800/70 bg-slate-950/70">
        <div className="marketing-shift mx-auto grid max-w-6xl gap-8 px-6 py-12 text-center md:grid-cols-4">
          <div>
            <p className="text-lg font-semibold">FixTray</p>
            <p className="mt-3 text-sm text-slate-400">
              The command center for modern work orders, approvals, and customer-ready updates.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><Link href="/features" className="hover:text-white">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/security" className="hover:text-white">Security</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Support</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><Link href="/auth/login" className="hover:text-white">Help Center</Link></li>
              <li><Link href="/auth/login" className="hover:text-white">Book a demo</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800/70">
          <div className="marketing-shift mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-6 py-6 text-center text-xs text-slate-500">
            <span>© 2026 FixTray. All rights reserved.</span>
            <span>Built for multi-shop operations and modern service teams.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
