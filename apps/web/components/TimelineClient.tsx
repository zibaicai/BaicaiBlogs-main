"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import DirectoryHeader from "./DirectoryHeader";
import DirectoryView from "./DirectoryView";
import PostCard from "./PostCard";
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
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  const items = timelinePosts.map((post) => <PostCard key={post.slug} post={post} />);

  return (
    <div className="directory-shell">
      <DirectoryHeader
        eyebrow="BAICAI / TIMELINE"
        title="研究终端"
        subtitle="沿着时间轴，检索被封存的知识"
        count={`总计 ${posts.length} 篇`}
      />

      <div className="flex flex-col items-center gap-8 mb-10 relative z-[99]">
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
            className="directory-search"
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

        <div className="w-full flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-white/20 bg-white/30 p-4 backdrop-blur-md dark:border-white/5 dark:bg-slate-800/30">
          <button
            onClick={() => setSelectedTag("All")}
            className={`directory-tab ${selectedTag === "All" ? "directory-tab-active" : ""}`}
          >
            全部档案
          </button>
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => setSelectedTag(tag.name)}
              className={`directory-tab ${selectedTag === tag.name ? "directory-tab-active" : ""}`}
            >
              {tag.name} <span className="opacity-50 ml-1">{tag.count}</span>
            </button>
          ))}
        </div>
      </div>

      <DirectoryView
        items={items}
        initialMode="timeline"
        empty="这个频段没有接收到任何信号 📡"
      />
    </div>
  );
}
