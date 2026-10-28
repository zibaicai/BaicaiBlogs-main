"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, FileText, FolderKanban, Images, Lock, MessageCircle, MessagesSquare, X, type LucideIcon } from "lucide-react";
import { useAuth } from "../lib/auth";
import { usePrivateBlog } from "../lib/private-blog";

type Feed = {
  posts: Array<{ id: number; slug: string; title: string; date?: string; description?: string }>;
  moments: Array<{ id: number; slug: string; content: string; date?: string }>;
  chatters: Array<{ id: number; slug: string; title: string; content: string; date?: string }>;
  projects: Array<{ id: number; projectId: string; name: string; description?: string }>;
  albums: Array<{ id: number; albumId: string; title: string; description?: string }>;
};

const EMPTY: Feed = { posts: [], moments: [], chatters: [], projects: [], albums: [] };

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        <Icon size={14} />
        {title}
        <span className="ml-auto rounded-full bg-white/10 px-2 py-1 text-[10px]">{count}</span>
      </div>
      {children}
    </section>
  );
}

export default function PrivateBlogSpace() {
  const { enabled, setEnabled } = usePrivateBlog();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [feed, setFeed] = useState<Feed>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !user) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch("/api/user/private-feed", {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success) {
          throw new Error(json?.message || "无法读取你的资源");
        }
        setFeed({ ...EMPTY, ...(json.data || {}) });
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "无法读取你的资源");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [enabled, user]);

  if (!enabled || pathname === "/login") return null;

  return (
    <div
      className="fixed inset-0 z-[100000] overflow-y-auto bg-[#070b14] text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="私密博客"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-400">
              Private mode / {user?.username || "guest"}
            </span>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight">
              <Lock size={26} className="text-emerald-400" /> 私密博客
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              这里只显示属于你的资源；公共文章、说说和项目不会出现在这个视图里。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(false)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
          >
            <X size={14} /> 退出私密模式
          </button>
        </header>

        {authLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center text-sm text-slate-400">
            正在确认登录状态…
          </div>
        ) : !user ? (
          <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center">
            <Lock size={32} className="mx-auto mb-4 text-emerald-400" />
            <h2 className="text-xl font-black">登录后才能进入私密博客</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              私密模式只展示当前账号自己的资源，不会展示公共内容。
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-black text-emerald-950 transition hover:bg-emerald-400"
            >
              去登录 <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center text-sm text-slate-400">
            正在整理你的资源…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-8 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ["文章", feed.posts.length],
                ["说说", feed.moments.length],
                ["杂谈", feed.chatters.length],
                ["项目", feed.projects.length],
                ["相册", feed.albums.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
                  <div className="mt-1 text-2xl font-black text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Section icon={FileText} title="我的文章" count={feed.posts.length}>
                {feed.posts.length ? (
                  <ul className="space-y-3">
                    {feed.posts.slice(0, 8).map((post) => (
                      <li key={post.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                        <div className="truncate text-sm font-bold">{post.title}</div>
                        <div className="mt-1 truncate text-[10px] text-slate-500">{post.date || "未发布"}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">还没有自己的文章。</p>
                )}
              </Section>

              <Section icon={MessageCircle} title="我的说说" count={feed.moments.length}>
                {feed.moments.length ? (
                  <ul className="space-y-3">
                    {feed.moments.slice(0, 5).map((moment) => (
                      <li key={moment.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-slate-300">
                        {moment.content}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">还没有自己的说说。</p>
                )}
              </Section>

              <Section icon={MessagesSquare} title="我的杂谈" count={feed.chatters.length}>
                {feed.chatters.length ? (
                  <ul className="space-y-3">
                    {feed.chatters.slice(0, 5).map((item) => (
                      <li key={item.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                        <div className="text-sm font-bold">{item.title}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] text-slate-500">{item.content}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">还没有自己的杂谈。</p>
                )}
              </Section>

              <Section icon={FolderKanban} title="我的项目" count={feed.projects.length}>
                {feed.projects.length ? (
                  <ul className="space-y-3">
                    {feed.projects.slice(0, 6).map((project) => (
                      <li key={project.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                        <div className="text-sm font-bold">{project.name}</div>
                        <div className="mt-1 truncate text-[11px] text-slate-500">{project.description}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">还没有自己的项目。</p>
                )}
              </Section>

              <Section icon={Images} title="我的相册" count={feed.albums.length}>
                {feed.albums.length ? (
                  <ul className="space-y-3">
                    {feed.albums.slice(0, 6).map((album) => (
                      <li key={album.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                        <div className="text-sm font-bold">{album.title}</div>
                        <div className="mt-1 truncate text-[11px] text-slate-500">{album.description}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">还没有自己的相册。</p>
                )}
              </Section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
