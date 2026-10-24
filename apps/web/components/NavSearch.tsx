"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Post } from "../lib/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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

export default function NavSearch({ open, onOpenChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/public/posts", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setPosts(Array.isArray(json?.data) ? json.data : []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

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
    return posts.filter((post) => {
      const title = (post.title || "").toLowerCase();
      const description = (post.description || "").toLowerCase();
      const tags = (post.tags || []).join(" ").toLowerCase();
      return title.includes(trimmed) || description.includes(trimmed) || tags.includes(trimmed);
    }).slice(0, 8);
  }, [posts, query]);

  const showResults = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className={`nav-search ${open ? "is-open" : ""}`}>
      <div className="nav-search-field">
        <Search size={15} className="nav-search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索文章、标签..."
          className="nav-search-input"
          aria-label="搜索文章"
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
            <div className="nav-search-empty">正在加载文章...</div>
          ) : results.length > 0 ? (
            results.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                onClick={() => {
                  setQuery("");
                  onOpenChange(false);
                }}
                className="nav-search-result"
              >
                <span className="nav-search-result-title">
                  <Highlight text={post.title} query={query} />
                </span>
                <span className="nav-search-result-desc">
                  <Highlight text={post.description || "继续阅读"} query={query} />
                </span>
                {post.date && <span className="nav-search-result-date">{String(post.date).slice(0, 10)}</span>}
              </Link>
            ))
          ) : (
            <div className="nav-search-empty">没有找到关于 “{query}” 的文章</div>
          )}
        </div>
      )}
    </div>
  );
}
