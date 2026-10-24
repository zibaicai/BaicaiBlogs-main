import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  FolderKanban,
  Images,
  MessageSquareText,
  ShieldAlert,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  PenLine,
  Settings,
  Sparkles,
  Waypoints,
  Upload,
} from "lucide-react";
import { api, getAdminUser, getToken, setAdminUser, setToken } from "./lib/api";
import { ToastProvider, useToast } from "./components/ToastProvider";
import { OperationProvider } from "./context/OperationContext";
import { SiteConfigProvider } from "./context/SiteConfigProvider";
import SettingsPage from "./pages/SettingsPage";
import GalleryPage from "./pages/GalleryPage";
import ReportsPage from "./pages/ReportsPage";
import DanmakuPage from "./pages/DanmakuPage";
import AccessPage from "./pages/AccessPage";
import EditorPage from "./pages/EditorPage";
import MomentsPage from "./pages/MomentsPage";

type Any = Record<string, any>;

function useLoad<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    setError("");
    fn()
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(reload, deps);
  return { data, error, loading, reload };
}

function Login() {
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!u.trim() || !p) {
      setMsg("请输入用户名和密码");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const j = await api.login(u.trim(), p);
      if (!j?.success || !j.data?.token) throw new Error(j?.message || "登录失败");
      setToken(j.data.token);
      setAdminUser(j.data.username || u.trim());
      nav("/");
    } catch (error) {
      setMsg("登录失败：" + (error instanceof Error ? error.message : "未知错误"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen admin-bg flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-2xl p-10 shadow-2xl"
      >
        <div className="w-16 h-16 mb-6 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">
          🌌
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Baicai CMS</h1>
        <p className="text-sm text-slate-400 mb-8 font-bold">管理端已迁移至独立 SPA</p>

        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
          用户名
        </label>
        <input
          value={u}
          onChange={(e) => setU(e.target.value)}
          autoComplete="username"
          className="w-full mb-4 rounded-2xl bg-black/20 border border-white/10 px-5 py-3.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="admin"
        />

        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
          密码
        </label>
        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-2xl bg-black/20 border border-white/10 px-5 py-3.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full mt-7 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="animate-spin" size={16} />} 登 录
        </button>
        <div className="mt-4 text-xs text-red-400 min-h-[18px] font-bold">{msg}</div>
      </form>
    </div>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "概览", icon: LayoutDashboard, end: true },
  { to: "/posts", label: "文章", icon: BookOpen },
  { to: "/projects", label: "项目", icon: FolderKanban },
  { to: "/gallery", label: "图片墙", icon: Images },
  { to: "/moments", label: "说说", icon: MessageSquareText },
  { to: "/danmaku", label: "弹幕", icon: MessageSquareText },
  { to: "/reports", label: "举报", icon: ShieldAlert },
  { to: "/access", label: "授权", icon: KeyRound },
  { to: "/timeline", label: "归档预览", icon: Waypoints },
  { to: "/settings", label: "设置", icon: Settings },
];

function Shell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const user = getAdminUser();

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // 即使后端失败也清理本地登录态
    }
    setToken("");
    setAdminUser("");
    nav("/login");
  };

  return (
    <div className="h-screen overflow-hidden admin-bg flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 p-5 border-r border-white/5 bg-slate-950/40 backdrop-blur-2xl overflow-y-auto">
        <Link to="/" className="flex items-center gap-3 px-3 py-3">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
            🌌
          </span>
          <span>
            <span className="block text-sm font-black text-white tracking-wider">Baicai CMS</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">
              Admin Console
            </span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl bg-white/5 border border-white/10 p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            当前账号
          </div>
          <div className="text-sm font-bold text-slate-200 truncate">{user || "admin"}</div>
          <button
            onClick={logout}
            className="mt-3 w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-black transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> 退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <header className="h-20 shrink-0 px-5 md:px-8 flex items-center justify-between border-b border-white/5 bg-slate-950/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="lg:hidden w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-sm">
              🌌
            </span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Baicai Console
              </div>
              <div className="text-sm font-bold text-slate-200">内容与配置中心</div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* 页面级操作由页面通过 Portal 注入，避免按钮跟随内容滚动 */}
            <div id="admin-header-actions" className="flex items-center" />
            <a
              href="https://www.zibaicai.cn"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors items-center gap-1"
            >
              访问 C 端 <ArrowUpRight size={14} />
            </a>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden admin-scrollbar px-5 md:px-8 pt-5 md:pt-8 pb-5 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 p-5 backdrop-blur-xl">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${tone}`}>{icon}</div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function Dashboard() {
  const { data: posts } = useLoad<any>(() => api.myPosts());
  const { data: projects } = useLoad<any>(() => api.myProjects());
  const list = posts?.data || [];
  const plist = projects?.data || [];
  const published = list.filter((x: Any) => x.visibility !== "private").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-white">概览</h1>
        <p className="text-sm text-slate-400 mt-1 font-bold">公开内容、可见性与快捷入口</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={18} />} label="文章" value={list.length} tone="bg-indigo-500/20 text-indigo-400" />
        <StatCard icon={<Sparkles size={18} />} label="公开文章" value={published} tone="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={<FolderKanban size={18} />} label="项目" value={plist.length} tone="bg-purple-500/20 text-purple-400" />
        <StatCard icon={<PenLine size={18} />} label="草稿" value={Math.max(0, list.length - published)} tone="bg-amber-500/20 text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white">最近文章</h2>
            <Link to="/posts" className="text-xs font-bold text-indigo-400 hover:underline">
              全部
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {list.slice(0, 5).map((post: Any) => (
              <Link
                key={post.slug}
                to={`/editor/${encodeURIComponent(post.slug)}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-black/10 hover:bg-white/5 px-4 py-3 transition-colors"
              >
                <span className="text-sm font-bold text-slate-200 truncate">{post.title}</span>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">
                  {String(post.date || "").slice(0, 10)}
                </span>
              </Link>
            ))}
            {list.length === 0 && <div className="text-sm text-slate-500 py-6 text-center">暂无文章</div>}
          </div>
        </div>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-lg font-black text-white mb-4">工作流</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link
              to="/editor/new"
              className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 px-5 py-4 text-white font-black text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-3"
            >
              <PenLine size={17} /> 写一篇新文章
            </Link>
            <Link
              to="/settings"
              className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-4 text-slate-200 font-bold text-sm transition-colors flex items-center gap-3"
            >
              <Settings size={17} className="text-indigo-400" /> 站点设置
            </Link>
            <Link
              to="/timeline"
              className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-4 text-slate-200 font-bold text-sm transition-colors flex items-center gap-3"
            >
              <Waypoints size={17} className="text-purple-400" /> 归档预览
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const VISIBILITY_ORDER = ["public", "unlisted", "private"];
const visibilityLabel: Record<string, string> = {
  public: "公开",
  unlisted: "不列出",
  private: "私密",
};

function VisibilityBadge({ value }: { value?: string }) {
  const v = value || "public";
  const tone =
    v === "private"
      ? "bg-red-500/15 text-red-400 border-red-500/20"
      : v === "unlisted"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${tone}`}>
      {visibilityLabel[v] || v}
    </span>
  );
}

function nextVisibility(value?: string) {
  const current = value || "public";
  return VISIBILITY_ORDER[(VISIBILITY_ORDER.indexOf(current) + 1) % VISIBILITY_ORDER.length];
}

function Posts() {
  const { data, loading, error, reload } = useLoad<any>(() => api.myPosts());
  const list = data?.data || [];
  const nav = useNavigate();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadMarkdown = async (file: File) => {
    setUploading(true);
    try {
      const res = await api.uploadPost(file);
      if (!res.success || !res.data) throw new Error(res.message || "上传失败");
      showToast(`已导入：${res.data.title || res.data.slug}`, "success");
      nav(`/editor/${encodeURIComponent(res.data.slug)}`);
    } catch (e) {
      showToast("上传失败：" + (e instanceof Error ? e.message : "未知错误"), "error");
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (slug: string, value?: string) => {
    try {
      await api.setPostVisibility(slug, nextVisibility(value));
      reload();
    } catch (e) {
      alert("切换失败：" + (e instanceof Error ? e.message : "未知错误"));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">文章</h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">可见性决定 C 端是否展示</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-black text-sm cursor-pointer transition-all flex items-center gap-2">
            <Upload size={16} /> {uploading ? "导入中..." : "上传 MD"}
            <input
              type="file"
              accept=".md,.markdown,text/markdown"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                if (file) void uploadMarkdown(file);
              }}
            />
          </label>
          <Link
            to="/editor/new"
            className="px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-500/25 transition-all"
          >
            + 新建
          </Link>
        </div>
      </div>

      {loading && <div className="text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16} />加载中…</div>}
      {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 text-sm font-bold">失败：{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {list.map((post: Any) => (
          <div key={post.slug} className="rounded-3xl bg-white/5 border border-white/10 p-5 hover:border-indigo-500/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-black text-white truncate">{post.title}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-1 truncate">{post.slug}</div>
              </div>
              <VisibilityBadge value={post.visibility} />
            </div>
            <div className="text-xs text-slate-400 mt-3 line-clamp-2">{post.description}</div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] font-bold text-slate-500">{String(post.date || "").slice(0, 10)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggle(post.slug, post.visibility)}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  切换可见性
                </button>
                <Link
                  to={`/editor/${encodeURIComponent(post.slug)}`}
                  className="px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500 text-indigo-300 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  编辑
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && list.length === 0 && <div className="text-center py-16 text-slate-500 font-bold">暂无文章</div>}
    </div>
  );
}

function Projects() {
  const { data, loading, error, reload } = useLoad<any>(() => api.myProjects());
  const list = data?.data || [];

  const toggle = async (projectId: string, value?: string) => {
    try {
      await api.setProjectVisibility(projectId, nextVisibility(value));
      reload();
    } catch (e) {
      alert("切换失败：" + (e instanceof Error ? e.message : "未知错误"));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-black text-white">项目</h1>
        <p className="text-sm text-slate-400 mt-1 font-bold">公开项目会出现在 C 端 Projects Matrix</p>
      </div>

      {loading && <div className="text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16} />加载中…</div>}
      {error && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 text-sm font-bold">失败：{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {list.map((project: Any) => (
          <div key={project.projectId} className="rounded-3xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl">{project.icon || "🚀"}</span>
                <div className="min-w-0">
                  <div className="text-base font-black text-white truncate">{project.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{project.projectId}</div>
                </div>
              </div>
              <VisibilityBadge value={project.visibility} />
            </div>
            <div className="text-xs text-slate-400 mt-3 line-clamp-2">{project.description}</div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => toggle(project.projectId, project.visibility)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                切换可见性
              </button>
            </div>
          </div>
        ))}
      </div>
      {!loading && list.length === 0 && <div className="text-center py-16 text-slate-500 font-bold">暂无项目</div>}
    </div>
  );
}

function TimelinePreview() {
  const { data, loading } = useLoad<any>(() => api.publicPosts());
  const list = data?.data || [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-black text-white">归档预览</h1>
        <p className="text-sm text-slate-400 mt-1 font-bold">公开数据源，与 C 端 /timeline 一致</p>
      </div>
      {loading && <div className="text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16} />加载中…</div>}
      <div className="flex flex-col gap-2">
        {list.map((post: Any) => (
          <a
            key={post.slug}
            href={`https://www.zibaicai.cn/posts/${encodeURIComponent(post.slug)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4 flex items-center justify-between gap-4 hover:border-indigo-500/30 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-200 truncate">{post.title}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{String(post.date || "").slice(0, 10)}</div>
            </div>
            <ArrowUpRight size={15} className="text-slate-500 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <OperationProvider>
        <SiteConfigProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Shell><Dashboard /></Shell></RequireAuth>} />
            <Route path="/posts" element={<RequireAuth><Shell><Posts /></Shell></RequireAuth>} />
            <Route path="/projects" element={<RequireAuth><Shell><Projects /></Shell></RequireAuth>} />
            <Route path="/timeline" element={<RequireAuth><Shell><TimelinePreview /></Shell></RequireAuth>} />
            <Route path="/gallery" element={<RequireAuth><Shell><GalleryPage /></Shell></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth><Shell><ReportsPage /></Shell></RequireAuth>} />
            <Route path="/moments" element={<RequireAuth><Shell><MomentsPage /></Shell></RequireAuth>} />
            <Route path="/danmaku" element={<RequireAuth><Shell><DanmakuPage /></Shell></RequireAuth>} />
            <Route path="/access" element={<RequireAuth><Shell><AccessPage /></Shell></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Shell><SettingsPage /></Shell></RequireAuth>} />
            <Route path="/editor/:slug?" element={<RequireAuth><EditorPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SiteConfigProvider>
      </OperationProvider>
    </ToastProvider>
  );
}
