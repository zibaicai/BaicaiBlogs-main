"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";

/**
 * Keeps a logged-in visitor's presence warm while they browse.
 * A 60s heartbeat and a 3-minute server window make the count tolerant
 * of one missed request without keeping closed tabs alive for long.
 */
export default function PresenceHeartbeat() {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const send = () => {
      if (cancelled) return;
      void fetch("/api/online/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        credentials: "include",
        keepalive: true,
      }).catch(() => undefined);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") send();
    };

    send();
    const timer = window.setInterval(send, 60_000);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, pathname]);

  return null;
}
