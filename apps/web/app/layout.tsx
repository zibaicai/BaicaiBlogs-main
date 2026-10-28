import type { Metadata } from "next";
import Script from "next/script";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";
import "./globals.css";
import "./github-markdown-light.css";
import "./github-markdown-dark.css";

import AppShell from "../components/AppShell";
import { getPublicSiteConfig } from "../lib/server-api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { siteInfo } = await getPublicSiteConfig();
  return {
    title: siteInfo.title,
    description: siteInfo.bio,
    icons: {
      icon: siteInfo.faviconUrl,
      apple: siteInfo.faviconUrl,
    },
  };
}

const THEME_BOOTSTRAP = `
  try {
    if (localStorage.getItem('blog-theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.setAttribute(
      'data-theme-preset',
      localStorage.getItem('theme-preset') === 'violet' ? 'violet' : 'ocean'
    );
    var effects = localStorage.getItem('visual-effects');
    if (effects === 'off' || (effects === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      document.documentElement.setAttribute('data-visual-mode', 'plain');
    }
  } catch (error) {}
`;

const SPLASH_BOOTSTRAP = `
  try {
    if (sessionStorage.getItem('hasSeenSplash') === 'true') {
      document.documentElement.classList.add('splash-seen');
    }
  } catch (error) {}
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getPublicSiteConfig();

  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP}
        </Script>

        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 0; visibility: hidden; pointer-events: none; }
              html.splash-seen #app-mount-root {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
              }
            `,
          }}
        />

        <Script id="handle-splash-logic" strategy="beforeInteractive">
          {SPLASH_BOOTSTRAP}
        </Script>
      </head>

      <body
        className="relative flex min-h-full w-screen flex-col overflow-x-hidden bg-slate-50 transition-colors duration-1000 dark:bg-slate-950"
        suppressHydrationWarning
      >
        <AppShell config={config}>{children}</AppShell>
      </body>
    </html>
  );
}
