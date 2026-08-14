"use client";

/**
 * 时间线页面 —— 从服务器获取当前登录用户的文章列表
 *
 * 改造说明：
 * 原实现从项目本地 posts/ 目录读取 .md 文件（服务端组件 + fs + gray-matter），
 * 现改为客户端组件通过 apiClient.getMyPosts() 从后端数据库获取文章数据。
 *
 * 核心功能：
 * 1. 从服务器加载当前用户的文章列表（getMyPosts）
 * 2. 支持上传 .md 文件直接导入文章（uploadPost）—— 上传后自动刷新列表
 * 3. tags 统计从前端计算（遍历 posts 的 tags 数组聚合）
 * 4. loading / error / 重试状态处理
 * 5. React 18 StrictMode 去重守卫
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import TimelineClient from '../../components/TimelineClient';
import { apiClient, type Post } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { Upload, Plus } from 'lucide-react';
import Link from 'next/link';

export default function Timeline() {
  const { showToast } = useToast();

  // 文章列表状态
  const [posts, setPosts] = useState<Post[]>([]);
  // 加载状态（控制 loading 动画）
  const [loading, setLoading] = useState(true);
  // 错误信息（接口失败时显示给用户）
  const [error, setError] = useState<string | null>(null);
  // 上传中状态（控制上传按钮禁用和动画）
  const [uploading, setUploading] = useState(false);

  // 隐藏的文件输入框引用（用于触发文件选择对话框）
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== 去重守卫：防止 React 18 StrictMode 下 useEffect 双调用导致重复请求 =====
  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);
  // 稳定 showToast 引用，避免其作为 useEffect 依赖导致重跑
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  /**
   * 从服务器加载当前用户的文章列表
   * 使用 inFlightRef 实现并发去重：如果请求正在进行中，复用同一个 Promise
   */
  const loadPosts = useCallback(async () => {
    // 如果已有请求在进行中，直接返回该 Promise，避免重复请求
    if (inFlightRef.current) return inFlightRef.current;

    const task = (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.getMyPosts();
        if (res.success) {
          setPosts(res.data);
        } else {
          setError(res.message || '加载失败');
          showToastRef.current('文章列表加载失败：' + (res.message || '未知错误'), 'error');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误';
        // 401/403 表示未登录或登录过期
        if (msg.includes('401') || msg.includes('403')) {
          setError('请先登录后查看文章');
        } else {
          setError(msg);
          showToastRef.current('文章列表加载失败：' + msg, 'error');
        }
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = task;
    return task;
  }, []);

  // 首次挂载时加载文章列表（hasLoadedRef 守卫 StrictMode 双调用）
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadPosts();
  }, [loadPosts]);

  /**
   * 处理 MD 文件上传
   * 用户选择文件后调用 apiClient.uploadPost 上传到服务器
   * 上传成功后重新加载文章列表
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 校验文件扩展名
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      showToast('仅支持 .md 或 .markdown 文件', 'warning');
      // 重置 input 值，允许重复选择同一文件
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const res = await apiClient.uploadPost(file);
      if (res.success) {
        showToast(`✅ 文件「${file.name}」上传成功`, 'success');
        // 上传成功后重新加载文章列表
        await loadPosts();
      } else {
        showToast('上传失败：' + res.message, 'error');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      if (msg.includes('401') || msg.includes('403')) {
        showToast('登录已过期，请重新登录', 'error');
      } else {
        showToast('上传失败：' + msg, 'error');
      }
    } finally {
      setUploading(false);
      // 重置 input 值，允许重复选择同一文件
      event.target.value = '';
    }
  };

  /**
   * 从文章列表中统计标签出现次数，生成 tags 数组
   * 例如 [{name: "React", count: 3}, {name: "Spring Boot", count: 2}]
   * 按出现次数倒序排列
   */
  const tags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      // 每篇文章的 tags 数组逐个统计
      post.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.keys(tagCounts)
      .map(name => ({ name, count: tagCounts[name] }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  // ===== 加载中状态 =====
  if (loading) {
    return (
      <div className="min-h-screen relative pb-32">
        <Navbar />
        <PageTransition>
          <div className="w-full max-w-5xl mx-auto mt-28 px-4 sm:px-10 flex flex-col items-center justify-center py-20">
            {/* 加载动画：旋转圆环 */}
            <div className="w-12 h-12 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">正在从服务器加载文章...</p>
          </div>
        </PageTransition>
      </div>
    );
  }

  // ===== 错误状态 =====
  if (error) {
    return (
      <div className="min-h-screen relative pb-32">
        <Navbar />
        <PageTransition>
          <div className="w-full max-w-5xl mx-auto mt-28 px-4 sm:px-10 flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-6">📡</div>
            <p className="text-slate-600 dark:text-slate-300 font-bold mb-2">{error}</p>
            {/* 重试按钮：清除守卫后重新加载 */}
            <button
              onClick={() => {
                hasLoadedRef.current = false;
                loadPosts();
              }}
              className="mt-4 px-6 py-3 bg-indigo-500 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-colors"
            >
              重新加载
            </button>
          </div>
        </PageTransition>
      </div>
    );
  }

  // ===== 正常渲染：将文章和标签传给 TimelineClient 组件展示 =====
  return (
    <div className="min-h-screen relative pb-32">
      <Navbar />
      <PageTransition>
        {/* 操作工具栏：上传 MD 文件 + 新建文章 */}
        <div className="w-full max-w-5xl mx-auto mt-28 px-4 sm:px-10 mb-6 flex items-center gap-3">
          {/* 上传 MD 文件按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl shadow-lg text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload size={16} className="group-hover:scale-110 transition-transform" />
                上传 MD 文件
              </>
            )}
          </button>

          {/* 新建文章按钮（跳转到编辑器） */}
          <Link
            href="/editor?type=post&id=new"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl shadow-lg text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all group"
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform" />
            新建文章
          </Link>

          {/* 隐藏的文件输入框，由按钮触发 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <TimelineClient posts={posts} tags={tags} />
      </PageTransition>
    </div>
  );
}
