"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Counts a page view once per client-side pathname change.
 * The UI itself should never wait for this request.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const sent = useRef(new Set<string>());

  useEffect(() => {
    if (!pathname || sent.current.has(pathname)) return;
    sent.current.add(pathname);

    const body = JSON.stringify({ path: pathname });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/public/visit", new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // fall through to fetch
    }

    void fetch("/api/public/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "include",
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
