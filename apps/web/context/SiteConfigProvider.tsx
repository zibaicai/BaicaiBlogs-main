"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSiteConfig } from "../hooks/useSiteConfig";
import type { SiteConfigState } from "../lib/site-config";

type InitialConfig = Omit<SiteConfigState, "loading" | "error">;

type SiteConfigContextValue = SiteConfigState & { refetch: () => Promise<void> };

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: InitialConfig;
}) {
  const config = useSiteConfig(initial);
  return <SiteConfigContext.Provider value={config}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfigContext() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error("useSiteConfigContext must be used within SiteConfigProvider");
  }
  return ctx;
}
