import type { Metadata } from "next";
import Script from "next/script";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";
import "./globals.css";
import "./github-markdown-light.css";
import "./github-markdown-dark.css";

import { ThemeProvider } from "../components/ThemeProvider";
import { AuthProvider } from "../lib/auth";
import { SiteConfigProvider } from "../context/SiteConfigProvider";
import { ToastProvider } from "../components/ToastProvider";
import { MusicProvider } from "../components/MusicProvider";
import SplashScreen from "../components/SplashScreen";
import BackgroundEffects from "../components/BackgroundEffects";
import BackgroundSlider from "../components/BackgroundSlider";
import DanmakuBackground from "../components/DanmakuBackground";
import DanmakuComposer from "../components/DanmakuComposer";
import GlobalSnow from "../components/GlobalSnow";
import FloatingPlayer from "../components/FloatingPlayer";
import GlobalToolbox from "../components/GlobalToolbox";
import ClickEffect from "../components/ClickEffect";
import WhalePet from "../components/WhalePet";
import PageViewTracker from "../components/PageViewTracker";
import PresenceHeartbeat from "../components/PresenceHeartbeat";
import Footer from "../components/Footer";
import { getPublicSiteConfig } from "../lib/server-api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { siteInfo } = await getPublicSiteConfig();
  return {
    title: siteInfo.title,
    description: siteInfo.bio,
    icons: { icon: siteInfo.faviconUrl, apple: siteInfo.faviconUrl },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await getPublicSiteConfig();
  const gradient = config.background.themeColors.join(", ");

  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {`
            try {
              if (localStorage.getItem('blog-theme') === 'dark') {
                document.documentElement.classList.add('dark');
              }
              var effects = localStorage.getItem('visual-effects');
              if (effects === 'off' || (effects === null && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
                document.documentElement.setAttribute('data-visual-mode', 'plain');
              }
            } catch (e) {}
          `}
        </Script>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 0; visibility: hidden; pointer-events: none; }
              html.splash-seen #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
            `,
          }}
        />
        <Script id="handle-splash-logic" strategy="beforeInteractive">
          {`
            try {
              if (sessionStorage.getItem('hasSeenSplash') === 'true') {
                document.documentElement.classList.add('splash-seen');
              }
            } catch (e) {}
          `}
        </Script>
      </head>

      <body
        className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <SiteConfigProvider initial={config}>
              <ToastProvider>
              <PageViewTracker />
              <PresenceHeartbeat />
              <SplashScreen />
              <MusicProvider>
                <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-1000">
                  <div className="site-backdrop fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                    {!config.background.useGradient && <BackgroundSlider />}
                    <div className="absolute inset-0 z-[-9] bg-white/30 dark:bg-slate-900/40 backdrop-blur-md transition-colors duration-1000" />
                    <div
                      className="absolute inset-0 z-[-8] opacity-60 dark:opacity-20 mix-blend-color transition-opacity duration-1000 transform-gpu"
                      style={{
                        background: `linear-gradient(-45deg, ${gradient})`,
                        backgroundSize: "400% 400%",
                        animation: "gradientMove 15s ease infinite",
                      }}
                    />
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/40 dark:bg-indigo-900/20 blur-[100px] rounded-full mix-blend-overlay z-[-7]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-purple-900/30 blur-[100px] rounded-full mix-blend-overlay z-[-7]" />
                    <div className="bg-effects-wrapper transition-opacity duration-1000">
                      <BackgroundEffects />
                    </div>
                  </div>

                  <DanmakuBackground />
                  <DanmakuComposer />
                  <GlobalSnow />

                  <div className="relative z-10 flex-1 flex flex-col">
                    {children}
                    <Footer />
                  </div>

                  <FloatingPlayer />
                  <GlobalToolbox />
                  <ClickEffect />
                </div>

                <style
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{
                    __html: `
                      @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                      body.winter-mode .bg-effects-wrapper { opacity: 0 !important; visibility: hidden; }
                      .winter-mode .snow-cap { position: relative !important; overflow: visible !important; }
                      .dark.winter-mode .snow-cap {
                        background-color: rgba(23, 37, 84, 0.4) !important;
                        border-color: rgba(59, 130, 246, 0.3) !important;
                        backdrop-filter: blur(12px) brightness(80%) !important;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
                      }
                      body.winter-mode .snow-cap {
                        background-color: rgba(239, 246, 255, 0.45) !important;
                        border-color: rgba(191, 219, 254, 0.6) !important;
                        backdrop-filter: blur(12px) saturate(120%) !important;
                        box-shadow: 0 8px 32px rgba(191, 219, 254, 0.25) !important;
                        transition: all 0.7s ease !important;
                      }
                    `,
                  }}
                />
              </MusicProvider>
            </ToastProvider>
            </SiteConfigProvider>
          </AuthProvider>
        </ThemeProvider>
        <WhalePet />
      </body>
    </html>
  );
}
