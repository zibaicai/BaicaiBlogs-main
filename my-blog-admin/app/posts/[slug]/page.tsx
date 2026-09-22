import Link from 'next/link';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm'; // 🌟 核心引入：支持删除线和表格等 GFM 语法
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 引入高亮主题
import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientSocials from '../../../components/ClientSocials';
import ClientTOC from '../../../components/ClientTOC';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';
import SidebarLyric from '../../../components/SidebarLyric';
import { Download } from 'lucide-react';

// 后端 API 基础地址（与 lib/api.ts 的 API_BASE_URL 保持一致）
// 去掉末尾斜杠：避免 '/' 与 '/api/...' 拼成 '//api/...'（协议相对 URL，主机名会变成 api）
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

/**
 * 生成静态路由参数
 *
 * 原实现：从项目本地 posts/ 目录遍历 .md 文件名
 * 现改造：请求后端公开接口 /api/public/posts 获取所有已发布文章的 slug
 *
 * 说明：静态构建阶段用 getAllPosts 拉全量 slug；运行时如果新增文章
 *       Next.js App Router 动态路由也能正常按需渲染（动态参数兜底）。
 */
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/posts`, {
      // 生成静态参数时缓存不要超过 60s，避免文章新增/删除时静态路径滞后
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.data)) return [];
    return json.data.map((post: { slug: string }) => ({ slug: post.slug }));
  } catch (e) {
    console.error('[generateStaticParams] 拉取文章 slug 失败：', e);
    return [];
  }
}

function extractToc(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc: { level: number; text: string; id: string }[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    toc.push({
      level: match[1].length,
      text: match[2].trim(),
      id: match[2].trim().toLowerCase().replace(/\s+/g, '-')
    });
  }
  return toc;
}

/**
 * 按 slug 拉取单篇文章数据
 *
 * 原实现：fs.readFileSync 本地 posts/{slug}.md → gray-matter 解析 frontmatter + body
 * 现改造：请求后端公开接口 /api/public/posts/{slug}
 *   - title / description / tags / cover / date → 后端 DTO 直接返回（字段和原 frontmatter 一致）
 *   - content → 后端已去除 frontmatter 的 Markdown 正文（与 parsed.body 等价），直接进入 unified 渲染
 *   - fileUrl → 阿里云 OSS 上该文章的原始 MD 文件 URL（含 frontmatter 的完整文件）
 *     用于页面右上角"下载原文件"按钮，满足"渲染的数据来源改为 OSS 存储"的要求
 *   - 可选兜底：当后端 content 为空时，主动 fetch(fileUrl) 从 OSS 下载原始 MD 作为降级渲染
 */
async function getPostData(slug: string) {
  let rawMarkdown = '';        // unified 渲染用的正文（无 frontmatter）
  let title = '';
  let date: string | undefined;
  let tags: string[] = [];
  let cover = '';
  let fileUrl = '';            // OSS 上的完整 MD 文件地址（包含 frontmatter）

  try {
    const res = await fetch(`${API_BASE_URL}/api/public/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`后端返回 ${res.status}`);
    const json = await res.json();
    if (!json?.success || !json.data) {
      throw new Error(json?.message || '文章不存在');
    }
    const post = json.data as {
      title?: string;
      date?: string;
      tags?: string[];
      cover?: string;
      content?: string;
      fileUrl?: string;
    };
    title = post.title || slug;
    date = post.date;
    tags = Array.isArray(post.tags) ? post.tags : [];
    cover = post.cover || '';
    fileUrl = post.fileUrl || '';

    if (post.content && typeof post.content === 'string') {
      rawMarkdown = post.content;
    }
  } catch (e) {
    console.error(`[getPostData] 后端接口获取文章 ${slug} 失败，尝试降级到 OSS fileUrl：`, e);
  }

  // —— 当后端 content 为空时，从 OSS fileUrl 抓取原始 MD 文件（含 frontmatter）进行降级渲染 ——
  if (!rawMarkdown && fileUrl) {
    try {
      const r = await fetch(fileUrl, { cache: 'force-cache' });
      if (!r.ok) throw new Error(`OSS HTTP ${r.status}`);
      const fileText = await r.text();
      const sepMatch = fileText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
      if (sepMatch) {
        rawMarkdown = fileText.slice(sepMatch[0].length);
        // 尝试从 frontmatter 简单抽取 title/tags
        const fm = sepMatch[1];
        const titleLine = fm.match(/^title:\s*(.+)$/m);
        if (titleLine && !title) title = titleLine[1].replace(/^["']|["']$/g, '').trim();
      } else {
        rawMarkdown = fileText;
      }
    } catch (e2) {
      console.error(`[getPostData] OSS 降级渲染也失败：`, e2);
    }
  }

  // ==========================================
  // 🌟 前台渲染清洗区：终极防吞换行补丁！
  // ==========================================

  let content = rawMarkdown;

  // 1. 强行修复数字列表缺少空格导致无法渲染为列表的 Bug (1.百度 -> 1. 百度)
  content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');

  // 2. 🌟 拯救被 Markdown 引擎吞噬的“连续空行”！
  // 统一换行符，并清理纯空格的废弃空行
  content = content.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');

  // 将代码块切开保护，只处理正文的连续空行！
  const blocks = content.split(/(```[\s\S]*?```)/g);
  content = blocks.map((block, index) => {
    // 奇数索引是代码块，原样返回，绝对不碰！
    if (index % 2 === 1) return block;

    // 偶数索引是正文。把 3 个以上的连续 \n 替换为真实的 <br/> 标签。
    // （3 个 \n 相当于中间空了 1 行真正的空白）
    return block.replace(/\n{3,}/g, (match) => {
      const brCount = match.length - 2;
      return '\n\n' + '<br/>'.repeat(brCount) + '\n\n';
    });
  }).join('');

  // ==========================================

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    // 🌟 allowDangerousHtml 必须开启，这样上面生成的 <br/> 才能顺利通过变成真正的换行！
    .use(remarkRehype, { allowDangerousHtml: true })
    // 🌟 核心升级：开启代码语言自动侦测，并限制白名单，大幅提高 C++ 和常用语言的猜中率！
    // @ts-ignore
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
      subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml']
    })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return {
    slug,
    contentHtml: processedContent.toString(),
    toc: extractToc(rawMarkdown),
    title,
    date,
    tags,
    cover: cover || siteConfig.defaultPostCover,
    fileUrl,   // 暴露给页面，用作右上角下载原 MD 按钮
  };
}

/**
 * 侧边栏"推荐最近文章"
 *
 * 原实现：fs.readdirSync 本地 posts/ 目录读取文件名
 * 现改造：请求后端公开接口 /api/public/posts 取已发布列表
 */
async function getRecentPosts(currentSlug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/posts`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.data)) return [];
    const all: { slug: string; title: string; date?: string }[] = json.data;
    return all
      .filter((p) => p.slug !== currentSlug)
      // 后端返回的列表已按 date desc 排序，直接取前 3 条即可
      .slice(0, 3)
      .map((p) => ({
        slug: p.slug,
        title: p.title || '无标题',
        date: p.date,
      }));
  } catch (e) {
    console.error('[getRecentPosts] 拉取推荐列表失败：', e);
    return [];
  }
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const postData = await getPostData(resolvedParams.slug);
  const recentPosts = await getRecentPosts(resolvedParams.slug);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">

          <article className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
              <img src={postData.cover} alt="封面" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
            </div>

            <div className="p-5 md:p-12 relative">
              <BackButton />

              <header className="mb-6 md:mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-5 md:pb-6 relative">
                <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug">
                  {postData.title}
                </h1>

                <div className="absolute top-0 right-0 flex items-center gap-2">
                  {postData.fileUrl && (
                    <a
                      href={postData.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 group flex items-center gap-2 active:scale-95 z-50"
                      title="从阿里云 OSS 下载原始 MD 文件"
                    >
                      <Download size={18} />
                      <span className="text-xs md:text-sm font-bold hidden md:inline-block group-hover:inline-block">原文件</span>
                    </a>
                  )}

                  <Link
                    href={`/editor?id=${postData.slug}&type=post`}
                    className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 group flex items-center gap-2 active:scale-95 z-50"
                  >
                    <span className="text-base md:text-lg">✏️</span>
                    <span className="text-xs md:text-sm font-bold hidden md:inline-block group-hover:inline-block">修改此篇</span>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 md:gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full w-max text-xs md:text-sm transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    写作时间：{postData.date}
                  </div>

                  {postData.tags.map((tag: string) => (
                    <div key={tag} className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-bold bg-white/30 dark:bg-slate-900/50 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                      <span className="text-[10px] md:text-xs opacity-70">#</span> {tag}
                    </div>
                  ))}
                </div>
              </header>

              <div className="relative">
                <style>{`
                  .prose h1 { font-size: 1.8rem !important; font-weight: 900 !important; margin-bottom: 1.2rem !important; margin-top: 2rem !important; line-height: 1.3 !important; color: inherit !important; }
                  .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; margin-bottom: 1rem !important; margin-top: 1.5rem !important; color: inherit !important; }
                  .prose h3 { font-size: 1.2rem !important; font-weight: 700 !important; margin-bottom: 0.8rem !important; color: inherit !important; }
                  .prose p { font-size: 0.95rem !important; line-height: 1.75 !important; color: inherit !important; }
                  
                  .prose a { color: #6366f1 !important; text-decoration: none !important; font-weight: 600 !important; border-bottom: 1px dashed #6366f1 !important; transition: all 0.3s ease !important; }
                  .prose a:hover { color: #4f46e5 !important; border-bottom-style: solid !important; background-color: rgba(99, 102, 241, 0.1) !important; padding: 0 0.2rem !important; border-radius: 0.2rem !important; }
                  .dark .prose a { color: #818cf8 !important; border-bottom-color: #818cf8 !important; }
                  .dark .prose a:hover { color: #a5b4fc !important; background-color: rgba(129, 140, 248, 0.15) !important; }

                  .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; font-size: 0.95rem !important; }
                  .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; font-size: 0.95rem !important; }
                  .prose li { display: list-item !important; margin-bottom: 0.5rem !important; }
                  
                  .prose ul ul, .prose ol ul { list-style-type: circle !important; margin-top: 0.25rem !important; margin-bottom: 0.25rem !important; }
                  .prose ol ol, .prose ul ol { list-style-type: lower-alpha !important; margin-top: 0.25rem !important; margin-bottom: 0.25rem !important; }
                  
                  .prose del { text-decoration-color: inherit !important; opacity: 0.6; }
                  
                  /* 🌟 引用块专属果冻极客风样式补丁 */
                  .prose blockquote {
                    border-left: 4px solid #6366f1 !important;
                    background-color: rgba(99, 102, 241, 0.05) !important;
                    padding: 1rem 1.5rem !important;
                    margin: 1.5rem 0 !important;
                    border-radius: 0 1.25rem 1.25rem 0 !important;
                    font-style: italic !important;
                    color: #64748b !important;
                  }
                  .prose blockquote p {
                    margin: 0 !important; 
                    color: inherit !important;
                  }
                  .dark .prose blockquote {
                    border-left-color: #818cf8 !important;
                    background-color: rgba(129, 140, 248, 0.1) !important;
                    color: #94a3b8 !important;
                  }
                  
                  .prose pre {
                    background-color: #282c34 !important; color: #abb2bf !important;
                    padding: 1rem !important; border-radius: 0.75rem !important;
                    overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important;
                    margin-top: 1rem !important; margin-bottom: 1rem !important;
                  }
                  
                  .prose pre code, .prose p code, .prose li code { 
                    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, ui-monospace, monospace !important; 
                    font-variant-ligatures: contextual !important; 
                  }
                  .prose pre code { 
                    background-color: transparent !important; 
                    padding: 0 !important; 
                    color: inherit !important; 
                    font-size: 0.85em !important; 
                  }
                  
                  .prose code::before, .prose code::after { content: none !important; }
                  .prose p code, .prose li code { background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; padding: 0.1rem 0.3rem !important; border-radius: 0.25rem !important; font-weight: 600 !important; font-size: 0.85em !important; }
                  .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }
                  .prose img { display: block !important; margin: 1.5rem auto !important; border-radius: 1rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; max-width: 100% !important; height: auto !important; }

                  .prose pre code .hljs-comment, .prose pre code .hljs-quote { color: #5c6370 !important; font-style: italic !important; }
                  .prose pre code .hljs-doctag, .prose pre code .hljs-keyword, .prose pre code .hljs-formula { color: #c678dd !important; }
                  .prose pre code .hljs-keyword.type_, .prose pre code .hljs-type { color: #c678dd !important; } 
                  .prose pre code .hljs-section, .prose pre code .hljs-name, .prose pre code .hljs-selector-tag, .prose pre code .hljs-deletion, .prose pre code .hljs-subst { color: #e06c75 !important; }
                  .prose pre code .hljs-literal { color: #56b6c2 !important; }
                  .prose pre code .hljs-string, .prose pre code .hljs-regexp, .prose pre code .hljs-addition, .prose pre code .hljs-attribute, .prose pre code .hljs-meta-string { color: #98c379 !important; }
                  .prose pre code .hljs-built_in, .prose pre code .hljs-class .hljs-title, .prose pre code .hljs-title.class_ { color: #e6c07b !important; } 
                  .prose pre code .hljs-attr, .prose pre code .hljs-variable, .prose pre code .hljs-template-variable, .prose pre code .hljs-selector-class, .prose pre code .hljs-selector-attr, .prose pre code .hljs-selector-pseudo, .prose pre code .hljs-number { color: #d19a66 !important; }
                  .prose pre code .hljs-symbol, .prose pre code .hljs-bullet, .prose pre code .hljs-link, .prose pre code .hljs-meta, .prose pre code .hljs-selector-id, .prose pre code .hljs-title, .prose pre code .hljs-title.function_ { color: #61aeee !important; } 

                  @media (min-width: 768px) {
                    .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; }
                    .prose h2 { font-size: 2.2rem !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; }
                    .prose h3 { font-size: 1.5rem !important; margin-bottom: 1rem !important; }
                    .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; }
                    
                    .prose ul, .prose ol { padding-left: 2rem !important; font-size: 1.1rem !important; }
                    
                    .prose pre { padding: 1.25rem !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                    .prose pre code { font-size: 0.9em !important; }
                    .prose p code, .prose li code { padding: 0.2rem 0.4rem !important; font-size: 0.9em !important; border-radius: 0.375rem !important;}
                    .prose img { margin: 2rem auto !important; border-radius: 2rem !important; box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important; }
                  }
                `}</style>

                <div
                  id="article-content"
                  className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none text-slate-800 dark:text-slate-200 transition-colors duration-700 scroll-smooth"
                  dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
                />
              </div>

              <div className="mt-12 md:mt-16">
                <Comments />
              </div>

            </div>
          </article>

          <aside className="w-full lg:w-[320px] flex flex-col gap-6 flex-shrink-0">
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl text-center">
              <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md mb-4 transition-transform duration-500 hover:rotate-3">
                <img src={siteConfig.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover bg-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{siteConfig.authorName}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-4">{siteConfig.bio}</p>
              <ClientSocials />
            </div>

            <SidebarLyric />

            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl">
              <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">RECOMMENDED</h3>
              <div className="space-y-4">
                {recentPosts.map(p => (
                  <Link key={p.slug} href={`/posts/${p.slug}`} className="group block">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{p.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold uppercase">{p.date}</p>
                  </Link>
                ))}
              </div>
            </div>

            {postData.toc.length > 0 && (
              <ClientTOC toc={postData.toc} />
            )}
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}
