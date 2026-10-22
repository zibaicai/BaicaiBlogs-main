"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { formatDate, type Post } from "../lib/api";
import { DEFAULT_BACKGROUND } from "../lib/site-config";

interface Props {
  post: Post;
  index: number;
}

export default function TimelineNode({ post, index }: Props) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`flex justify-between items-center w-full ${isLeft ? "md:flex-row-reverse" : "flex-row"}`}
    >
      <div className="order-1 w-5/12 hidden md:block" />

      <div className="z-20 flex items-center justify-center order-1 bg-white dark:bg-slate-900 shadow-xl w-6 h-6 rounded-full border-4 border-indigo-400 ring-4 ring-indigo-200/50 dark:ring-indigo-900/30 transition-all duration-1000" />

      <div className="order-1 w-full md:w-5/12 group relative">
        <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="block">
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-[32px] shadow-xl border border-white/60 dark:border-white/10 transition-all duration-500 hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-slate-800/70 overflow-hidden flex flex-col">
            <div className="w-full h-40 overflow-hidden relative">
              <img
                src={post.cover || DEFAULT_BACKGROUND.defaultPostCover}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-widest">
                <Calendar size={12} className="text-indigo-400" />
                {formatDate(post.date)}
              </div>
            </div>

            <div className="p-7">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-3 group-hover:text-indigo-500 transition-colors line-clamp-1 leading-tight">
                {post.title}
              </h3>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-500/5 text-slate-400 border border-slate-500/10"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 font-medium opacity-80">
                {post.description}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
