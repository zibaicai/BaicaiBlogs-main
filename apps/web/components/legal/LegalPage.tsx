import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "../Navbar";
import PageTransition from "../PageTransition";

interface LegalPageProps {
  title: string;
  subtitle: string;
  current: "terms" | "privacy" | "copyright";
  children: ReactNode;
}

const LINKS = [
  { href: "/terms", label: "用户协议", key: "terms" },
  { href: "/privacy", label: "隐私政策", key: "privacy" },
  { href: "/copyright", label: "侵权投诉", key: "copyright" },
] as const;

export default function LegalPage({ title, subtitle, current, children }: LegalPageProps) {
  return (
    <div className="relative min-h-screen pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="mx-auto max-w-4xl">
            <header className="mb-8 rounded-3xl border border-white/30 bg-white/65 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65">
              <div className="mb-4 flex flex-wrap gap-2">
                {LINKS.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                      current === link.key
                        ? "bg-[var(--ui-accent)] text-[var(--ui-accent-contrast)]"
                        : "border border-white/30 bg-white/20 text-slate-500 hover:text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <h1 className="display-title text-slate-900 dark:text-white">
                {title}
              </h1>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {subtitle}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
                最后更新：2026-10-28
              </p>
            </header>

            <article className="legal-document rounded-3xl border border-white/40 bg-white/85 p-7 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 md:p-10">
              <style>{`
                .legal-document h2 { margin: 2rem 0 .8rem; font-size: 1.15rem; font-weight: 900; color: var(--ui-text-strong); }
                .legal-document h2:first-child { margin-top: 0; }
                .legal-document h3 { margin: 1.35rem 0 .5rem; font-size: .95rem; font-weight: 800; color: var(--ui-text); }
                .legal-document p, .legal-document li { margin: .55rem 0; font-size: .9rem; line-height: 1.85; color: var(--ui-text-muted); }
                .legal-document ul { list-style: disc; padding-left: 1.4rem; }
                .legal-document a { color: var(--ui-accent); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
                .legal-document strong { color: var(--ui-text); font-weight: 800; }
              `}</style>
              {children}
            </article>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
