"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "../lib/auth";
import { PersonalViewProvider } from "../lib/personal-view";
import { SiteConfigProvider } from "../context/SiteConfigProvider";
import { ThemeProvider } from "./ThemeProvider";
import { TypographyProvider } from "./TypographyProvider";
import { ToastProvider } from "./ToastProvider";
import { FeedbackProvider } from "./FeedbackProvider";
import { MusicProvider } from "./MusicProvider";
import PageViewTracker from "./PageViewTracker";
import PresenceHeartbeat from "./PresenceHeartbeat";
import SplashScreen from "./SplashScreen";
import ThemeBackdrop from "./ThemeBackdrop";
import Footer from "./Footer";
import GlobalToolbox from "./GlobalToolbox";
import DeferredEffects from "./DeferredEffects";

interface AppShellProps {
  config: any;
  children: ReactNode;
}

export default function AppShell({ config, children }: AppShellProps) {
  return (
    <>
      <ThemeProvider>
        <TypographyProvider>
          <AuthProvider>
          <PersonalViewProvider>
          <SiteConfigProvider initial={config}>
            <FeedbackProvider>
            <ToastProvider>
              <PageViewTracker />
              <PresenceHeartbeat />
              <SplashScreen />

              <MusicProvider>
                <div id="app-mount-root" className="flex flex-1 flex-col transition-opacity duration-1000">
                  <ThemeBackdrop />

                  <div className="relative z-10 flex flex-1 flex-col">
                    {children}
                    <Footer />
                  </div>

                  <GlobalToolbox />
                </div>

                <DeferredEffects />

                <style
                  suppressHydrationWarning
                  dangerouslySetInnerHTML={{
                    __html: `
                      @keyframes gradientMove {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                      }
                      body.winter-mode .bg-effects-wrapper {
                        opacity: 0 !important;
                        visibility: hidden;
                      }
                      body.winter-mode .snow-cap {
                        position: relative !important;
                        overflow: visible !important;
                        background-color: rgba(239, 246, 255, 0.45) !important;
                        border-color: rgba(191, 219, 254, 0.6) !important;
                        backdrop-filter: blur(12px) saturate(120%) !important;
                        box-shadow: 0 8px 32px rgba(191, 219, 254, 0.25) !important;
                        transition: all 0.7s ease !important;
                      }
                      .dark.winter-mode .snow-cap {
                        background-color: rgba(23, 37, 84, 0.4) !important;
                        border-color: rgba(59, 130, 246, 0.3) !important;
                        backdrop-filter: blur(12px) brightness(80%) !important;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
                      }
                    `,
                  }}
                />
              </MusicProvider>
            </ToastProvider>
            </FeedbackProvider>
          </SiteConfigProvider>
          </PersonalViewProvider>
        </AuthProvider>
        </TypographyProvider>
      </ThemeProvider>
    </>
  );
}
