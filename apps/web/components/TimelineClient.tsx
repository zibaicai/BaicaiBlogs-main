"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, LayoutGrid, ListTree, Search } from "lucide-react";
import TimelineNode from "./TimelineNode";
import DirectoryHeader from "./DirectoryHeader";
import { formatDay, type Post } from "../lib/api";

interface TimelineTag {
  name: string;
  count: number;
}

export default function TimelineClient({
  posts,
  tags,
}: {
  posts: Post[];
  tags: TimelineTag[];
}) {
  const [selectedTag, setSelectedTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "card">("timeline");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        (post.description && post.description.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);

  const timelinePosts = useMemo(
    () => posts.filter((post) => selectedTag === "All" || post.tags?.includes(selectedTag)),
    [posts, selectedTag]
  );

  const handleGridScroll = () => {
    if (gridScrollRef.current) setShowScrollTop(gridScrollRef.current.scrollTop > 200);
  };

  const scrollToTop = () => {
    gridScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <div className="directory-shell">
      <DirectoryHeader
        eyebrow="BAICAI / TIMELINE"
        title="研究终端"
        subtitle="沿着时间轴，检索被封存的知识"
        count={`总计 ${posts.length} 篇`}
      />
      <div className="flex flex-col items-center gap-8 mb-16 relative z-[99]">
        <div className="relative w-full max-w-lg group" ref={searchContainerRef}>
          <input
            type="text"
            placeholder="搜寻被封存的知识..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl px-6 py-4 pl-14 text-slate-800 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium relative z-20"
          />
          <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-20" />

          <AnimatePresence>
            {isDropdownOpen && searchQuery.trim() !== "" && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden max-h-[360px] overflow-y-auto z-[100]"
              >
                {searchResults.length > 0 ? (
                  <div className="flex flex-col py-2">
                    {searchResults.map((post) => (
                      <Link
                        href={`/posts/${encodeURIComponent(post.slug)}`}
                        key={post.slug}
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-6 py-4 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 pr-4">
                            {post.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0">
                            {formatDay(post.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                          {post.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                    赛博空间里找不到这个印记 🌌
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md p-4 rounded-3xl border border-white/20 dark:border-white/5">
          <div className="flex flex-wrap justify-center md:justify-start gap-2 flex-1">
            <button
              onClick={() => setSelectedTag("All")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                selectedTag === "All"
                  ? "bg-indigo-500 text-white shadow-md"
                  : "bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white"
              }`}
            >
              全部档案
            </button>
            {tags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => setSelectedTag(tag.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  selectedTag === tag.name
                    ? "bg-indigo-500 text-white shadow-md"
                    : "bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white"
                }`}
              >
                {tag.name} <span className="opacity-50 ml-1">{tag.count}</span>
              </button>
            ))}
          </div>

          <div className="flex bg-white/50 dark:bg-slate-900/50 p-1 rounded-2xl shadow-inner shrink-0">
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <ListTree size={16} />
              <span className="hidden sm:inline">中枢链路</span>
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                viewMode === "card"
                  ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">矩阵网格</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "card" && (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full"
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  .cyber-scrollbar::-webkit-scrollbar { width: 12px; }
                  .cyber-scrollbar::-webkit-scrollbar-track { background: rgba(99,102,241,0.05); border-radius: 12px; margin-top: 20px; margin-bottom: 56px; }
                  .cyber-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#818cf8 0%,#c084fc 100%); border-radius: 12px; border: 2px solid transparent; background-clip: padding-box; }
                  .fade-edges { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%); }
                `,
              }}
            />

            <div
              ref={gridScrollRef}
              onScroll={handleGridScroll}
              className="h-[75vh] overflow-y-auto cyber-scrollbar pr-5 pb-10 fade-edges"
            >
              <div className="directory-grid pt-4 pb-10">
                {timelinePosts.map((post, idx) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <div className="directory-card group">
                      <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="block flex-1 flex flex-col cursor-pointer">
                        <div className="directory-card-media h-40">
                          <img
                            src={post.cover}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="directory-date-badge">
                            {formatDay(post.date)}
                          </span>
                        </div>
                        <div className="directory-card-body">
                          <h3 className="directory-card-title">
                            {post.title}
                          </h3>
                          <p className="directory-card-description">
                            {post.description || "没有描述..."}
                          </p>
                          <div className="directory-card-tags">
                            {(post.tags || []).map((tag: string) => (
                              <span
                                key={tag}
                                className="directory-tag"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {showScrollTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 10 }}
                  onClick={scrollToTop}
                  className="absolute bottom-4 -right-3 w-9 h-9 flex items-center justify-center bg-gradient-to-t from-purple-500 to-indigo-500 text-white rounded-full shadow-lg shadow-purple-500/40 hover:-translate-y-1 transition-all z-50"
                  title="回到顶部"
                >
                  <ArrowUp size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {viewMode === "timeline" && (
          <motion.div
            key="timeline-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden p-2 md:p-10 min-h-[500px]"
          >
            <div className="absolute border-opacity-20 border-indigo-500 dark:border-indigo-400/20 h-full border-2 left-1/2 transform -translate-x-1/2 rounded-full transition-colors duration-1000" />

            <div className="relative z-10 flex flex-col gap-16">
              <AnimatePresence mode="popLayout">
                {timelinePosts.map((post, index) => (
                  <TimelineNode key={post.slug} post={post} index={index + 1} />
                ))}
              </AnimatePresence>

              {timelinePosts.length === 0 && (
                <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">
                  这个频段没有接收到任何信号 📡
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
