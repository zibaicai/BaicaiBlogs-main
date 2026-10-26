"use client";

import { useEffect, useState } from "react";
import { Activity, Clock3, Eye, HeartPulse, Users } from "lucide-react";

interface DashboardData {
  uptime: { startAt: string; days: number; hours: number };
  visits: { total: number; type: "PV" };
  online: { count: number; windowSeconds: number };
  health: {
    status: "ok" | "degraded" | "error";
    checks: Record<string, string>;
    checkedAt: string;
  };
  updatedAt: string;
}

const HEALTH_COPY = {
  ok: { label: "正常", tone: "is-ok" },
  degraded: { label: "注意", tone: "is-degraded" },
  error: { label: "异常", tone: "is-error" },
};

export default function SiteDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch("/api/public/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json();
        if (!cancelled && json?.success && json.data) {
          setData(json.data);
          setFailed(false);
        }
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          setFailed(true);
        }
      }
    };

    void load();
    const timer = window.setInterval(load, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const online = data?.online.count ?? 0;
  const health = data?.health.status ?? "error";
  const healthCopy = HEALTH_COPY[health];
  const healthDetail = data
    ? Object.entries(data.health.checks).map(([key, value]) => `${key}: ${value}`).join(" · ")
    : "等待健康检查";

  return (
    <section className="hv-panel hv-metrics" aria-label="小屋仪表盘">
      <div className="hv-metric">
        <div className="hv-metric-icon"><Clock3 size={15} /></div>
        <span className="hv-metric-label">RUNNING</span>
        <strong className="hv-metric-value">
          {data ? <>{data.uptime.days}<em>天</em> {data.uptime.hours}<em>小时</em></> : "--"}
        </strong>
        <span className="hv-metric-note">自 {data?.uptime.startAt?.slice(0, 10) || "2025-12-31"}</span>
      </div>

      <div className="hv-metric">
        <div className="hv-metric-icon"><Eye size={15} /></div>
        <span className="hv-metric-label">VISITS</span>
        <strong className="hv-metric-value">
          {data ? data.visits.total.toLocaleString("zh-CN") : "--"}
        </strong>
        <span className="hv-metric-note">累计访问 · {data?.visits.type || "PV"}</span>
      </div>

      <div className="hv-metric">
        <div className="hv-metric-icon"><Users size={15} /></div>
        <span className="hv-metric-label">ONLINE</span>
        <strong className="hv-metric-value hv-metric-online">
          <span className={`hv-metric-dot ${online > 0 ? "is-live" : ""}`} />
          {data ? String(online).padStart(2, "0") : "--"}
        </strong>
        <span className="hv-metric-note">已登录 · 3 分钟窗口</span>
      </div>

      <div className="hv-metric" title={healthDetail}>
        <div className="hv-metric-icon"><HeartPulse size={15} /></div>
        <span className="hv-metric-label">STATUS</span>
        <strong className={`hv-metric-value hv-health ${healthCopy.tone}`}>
          <span className="hv-metric-dot" />
          {data ? healthCopy.label : failed ? "异常" : "--"}
        </strong>
        <span className="hv-metric-note">API · 数据库 · 对象存储</span>
      </div>

      <span className="hv-metrics-refresh"><Activity size={10} /> 每分钟刷新</span>
    </section>
  );
}
