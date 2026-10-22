import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api, getToken, setToken } from "./api";

type Any = Record<string, any>;

function useLoad<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true); setError("");
    fn().then((d) => setData(d)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(reload, deps);
  return { data, error, loading, reload };
}

function Login() {
  const nav = useNavigate();
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [msg, setMsg] = useState("");
  const submit = async () => {
    try {
      const j = await api.login(u, p);
      if (!j?.success) throw new Error(j?.message || "登录失败");
      setToken(j.data.token); localStorage.setItem("bc_admin_user", u); nav("/");
    } catch (e: any) { setMsg("登录失败：" + e.message); }
  };
  return (
    <div className="card" style={{ maxWidth: 420, margin: "60px auto" }}>
      <h2>登录</h2>
      <input placeholder="用户名" value={u} onChange={(e) => setU(e.target.value)} />
      <input type="password" placeholder="密码" value={p} onChange={(e) => setP(e.target.value)} />
      <button onClick={submit}>登录</button>
      <div className="muted">{msg}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [me] = useState<Any>({ username: localStorage.getItem("bc_admin_user") || "" });
  const logout = () => { setToken(""); nav("/login"); };
  return (
    <div className="wrap">
      <div className="nav">
        <strong>Baicai 管理后台</strong>
        <Link to="/">概览</Link>
        <Link to="/posts">文章</Link>
        <Link to="/projects">项目</Link>
        <Link to="/timeline">归档预览</Link>
        <span className="sp" />
        <span className="muted">{me?.username}</span>
        <button className="gray" onClick={logout}>退出</button>
      </div>
      {children}
    </div>
  );
}

function Dashboard() {
  const { data: posts } = useLoad<any>(() => api.myPosts());
  const { data: projects } = useLoad<any>(() => api.myProjects());
  const list = posts?.data || []; const plist = projects?.data || [];
  return (
    <Shell>
      <h2>概览</h2>
      <div className="card">文章：{list.length}（公开 {list.filter((x: Any) => x.visibility !== "private").length}）</div>
      <div className="card">项目：{plist.length}</div>
      <p className="muted">编辑器迁移中，暂时通过旧站入口编辑：<a href="https://www.zibaicai.cn/editor">打开旧编辑器</a></p>
    </Shell>
  );
}

function Posts() {
  const { data, loading, error, reload } = useLoad<any>(() => api.myPosts());
  const list = data?.data || [];
  const toggle = async (slug: string, v: string) => { await api.setPostVisibility(slug, v === "private" ? "public" : "private"); reload(); };
  return (
    <Shell>
      <h2>我的文章</h2>
      {loading && <div className="card muted">加载中…</div>}
      {error && <div className="card muted">失败：{error}</div>}
      {!loading && list.length === 0 && <div className="card muted">暂无文章</div>}
      {list.map((p: Any) => (
        <div className="card row" key={p.slug}>
          <div><strong>{p.title}</strong><div className="muted">{p.slug}</div></div>
          <div className="row">
            <span className={"tag " + (p.visibility === "private" ? "private" : "")}>{p.visibility || "public"}</span>
            <button className="gray" onClick={() => toggle(p.slug, p.visibility)}>切换</button>
          </div>
        </div>
      ))}
    </Shell>
  );
}

function Projects() {
  const { data, loading, error, reload } = useLoad<any>(() => api.myProjects());
  const list = data?.data || [];
  const toggle = async (id: string, v: string) => { await api.setProjectVisibility(id, v === "private" ? "public" : "private"); reload(); };
  return (
    <Shell>
      <h2>我的项目</h2>
      {loading && <div className="card muted">加载中…</div>}
      {error && <div className="card muted">失败：{error}</div>}
      {list.map((p: Any) => (
        <div className="card row" key={p.projectId}>
          <div><strong>{p.name}</strong><div className="muted">{p.projectId}</div></div>
          <div className="row">
            <span className={"tag " + (p.visibility === "private" ? "private" : "")}>{p.visibility || "public"}</span>
            <button className="gray" onClick={() => toggle(p.projectId, p.visibility)}>切换</button>
          </div>
        </div>
      ))}
    </Shell>
  );
}

function TimelinePreview() {
  const { data } = useLoad<any>(() => api.publicPosts());
  const list = data?.data || [];
  return (
    <Shell>
      <h2>归档预览（公开内容）</h2>
      {list.map((p: Any) => (
        <div className="card row" key={p.slug}>
          <span>{(p.date || "").slice(0, 10)} — {p.title}</span>
          <a href={`https://www.zibaicai.cn/posts/${encodeURIComponent(p.slug)}`}>查看</a>
        </div>
      ))}
    </Shell>
  );
}

export default function App() {
  const authed = !!getToken();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={authed ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/admin" element={authed ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/posts" element={authed ? <Posts /> : <Navigate to="/login" />} />
      <Route path="/projects" element={authed ? <Projects /> : <Navigate to="/login" />} />
      <Route path="/timeline" element={authed ? <TimelinePreview /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}