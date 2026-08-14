"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSiteConfig, type SiteConfigState } from '../hooks/useSiteConfig';

type SiteConfigContextValue = SiteConfigState & {
  refetch: () => void;
};

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const config = useSiteConfig();
  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfigContext() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error('useSiteConfigContext must be used within SiteConfigProvider');
  }
  return ctx;
}
