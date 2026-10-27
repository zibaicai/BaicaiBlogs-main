"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Album, Friend, Moment, Post, Project } from "../lib/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ResultKind = "文章" | "说说" | "影像" | "项目" | "友链";

interface GlobalResult {
  key: string;
  kind: ResultKind;
  title: string;
  description: string;
  href: string;
  date?: string;
  searchText: string;
}

const Highlight = ({ text = "", query = "" }: { text?: string; query?: string }) => {
  if (!query.trim() || !text) return <>{text}</>;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="rounded bg-indigo-500/20 px-0.5 text-indigo-600 dark:text-indigo-300">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

async function fetchData<T>(path: string): Promise<T[]> {
  const res = await fetch(path, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  return Array.isArray(json?.data) ? json.data : [];
}

function stripHtml(value?: string) {
  return (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function NavSearch({ open, onOpenChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GlobalResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      fetchData<Post>("/api/public/posts"),
      fetchData<Moment>("/api/public/moments"),
      fetchData<Album>("/api/public/albums"),
      fetchData<Project>("/api/public/projects"),
      fetchData<Friend>("/api/public/friends"),
    ])
      .then(([postRes, momentRes, albumRes, projectRes, friendRes]) => {
        if (cancelled) return;
        const next: GlobalResult[] = [];

        if (postRes.status === "fulfilled") {
          next.push(...postRes.value.map((post) => ({
            key: `post-${post.slug}`,
            kind: "文章" as const,
            title: post.title || "无题",
            description: post.description || "继续阅读这篇记录。",
            href: `/posts/${encodeURIComponent(post.slug)}`,
            date: post.date,
            searchText: [post.title, post.description, ...(post.tags || [])].join(" "),
          })));
        }

        if (momentRes.status === "fulfilled") {
          next.push(...momentRes.value.map((moment) => {
            const text = stripHtml(moment.htmlContent) || moment.content || "";
            return {
              key: `moment-${moment.slug}`,
              kind: "说说" as const,
              title: "说说",
              description: text.slice(0, 100) || "一条碎碎念。",
              href: "/moments",
              date: moment.date,
              searchText: [moment.content, text].join(" "),
            };
          }));
        }

        if (albumRes.status === "fulfilled") {
          next.push(...albumRes.value.map((album) => ({
            key: `album-${album.albumId}`,
            kind: "影像" as const,
            title: album.title || "相册",
            description: album.description || `${album.photos?.length || 0} 张照片`,
            href: `/photowall/${encodeURIComponent(album.albumId)}`,
            date: album.date,
            searchText: [album.title, album.description].join(" "),
          })));
        }

        if (projectRes.status === "fulfilled") {
          next.push(...projectRes.value.map((project) => ({
            key: `project-${project.projectId}`,
            kind: "项目" as const,
            title: project.name || "项目",
            description: project.description || "查看项目详情。",
            href: "/projects",
            searchText: [project.name, project.description, ...(project.tags || [])].join(" "),
          })));
        }

        if (friendRes.status === "fulfilled") {
          next.push(...friendRes.value.map((friend) => ({
            key: `friend-${friend.friendId}`,
            kind: "友链" as const,
            title: friend.name || "朋友",
            description: friend.description || friend.url || "访问友链。",
            href: "/friends",
            searchText: [friend.name, friend.description, friend.url].join(" "),
          })));
        }

        setItems(next);
        setLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const field = fieldRef.current;
    if (!field) return;

    const animation = field.animate(
      open
        ? [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }]
        : [{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
      {
        duration: 500,
        easing: "cubic-bezier(0.33, 0, 0.67, 1)",
        fill: "both",
      }
    );

    return () => animation.cancel();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return items
      .filter((item) => item.searchText.toLowerCase().includes(trimmed))
      .slice(0, 12);
  }, [items, query]);

  const showResults = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className={`nav-search ${open ? "is-open" : ""}`}>
      <div ref={fieldRef} className="nav-search-field">
        <Search size={15} className="nav-search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索文章、说说、相册、项目..."
          className="nav-search-input"
          aria-label="全站搜索"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="nav-search-trigger"
        aria-label={open ? "关闭搜索" : "打开搜索"}
        aria-expanded={open}
      >
        {open ? <X size={16} /> : <Search size={17} />}
      </button>

      {showResults && (
        <div className="nav-search-results">
          {loading ? (
            <div className="nav-search-empty">正在索引全站内容...</div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => {
                  setQuery("");
                  onOpenChange(false);
                }}
                className="nav-search-result"
              >
                <span className="nav-search-result-title">
                  <span className="nav-search-result-kind">{item.kind}</span>
                  <Highlight text={item.title} query={query} />
                </span>
                <span className="nav-search-result-desc">
                  <Highlight text={item.description} query={query} />
                </span>
                {item.date && <span className="nav-search-result-date">{String(item.date).slice(0, 10)}</span>}
              </Link>
            ))
          ) : (
            <div className="nav-search-empty">没有找到关于“{query}”的内容</div>
          )}
        </div>
      )}
    </div>
  );
}
