import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";
import "./globals.css";
import "./github-markdown-light.css";
import "./github-markdown-dark.css";

import AppShell from "../components/AppShell";
import { getPublicSiteConfig } from "../lib/server-api";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

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
  const splashName = config.siteInfo?.navAfter || config.siteInfo?.title || "云端小屋";

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
              html:not(.splash-seen) #app-mount-root {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
              }
              html.splash-seen #app-mount-root {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
                transition: opacity 800ms ease;
              }
              #splash-static {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff;
              }
              html.dark #splash-static { background: #020617; }
              html.splash-seen #splash-static { display: none; }
              @keyframes splash-static-spin { to { transform: rotate(360deg); } }
              #splash-static .splash-static-spinner {
                width: 36px;
                height: 36px;
                border-radius: 9999px;
                border: 2px solid color-mix(in srgb, var(--ui-accent, #6366f1) 20%, transparent);
                border-top-color: var(--ui-accent, #6366f1);
                animation: splash-static-spin 0.8s linear infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                #splash-static .splash-static-spinner { animation: none; }
              }
            `,
          }}
        />
        <noscript>
          <style>{`
            #splash-static { display: none !important; }
            html:not(.splash-seen) #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
          `}</style>
        </noscript>

        <Script id="handle-splash-logic" strategy="beforeInteractive">
          {SPLASH_BOOTSTRAP}
        </Script>
      </head>

      <body
        className="relative flex min-h-full w-screen flex-col bg-slate-50 transition-colors duration-1000 dark:bg-slate-950"
        suppressHydrationWarning
      >
        <div id="splash-static" aria-hidden="true">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "relative", width: 100, height: 100, marginBottom: 32 }}>
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: "9999px",
                  background: "conic-gradient(from 0deg, var(--ui-accent, #6366f1), transparent, var(--ui-accent, #6366f1))",
                  opacity: 0.6,
                  filter: "blur(3px)",
                }}
              />
              <img
                src="/pet/whale-idle.webp"
                alt=""
                style={{ position: "relative", width: "100%", height: "100%", borderRadius: "9999px", objectFit: "cover" }}
              />
            </div>
            <h1
              style={{
                marginBottom: 8,
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#1e293b",
              }}
            >
              {splashName}
            </h1>
            <p
              style={{
                marginBottom: 48,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#94a3b8",
              }}
            >
              CLOUD CABIN IS LOADING...
            </p>
            <div className="splash-static-spinner" role="progressbar" aria-label="加载中" />
          </div>
        </div>
        <AppShell config={config}>{children}</AppShell>
      </body>
    </html>
  );
}
