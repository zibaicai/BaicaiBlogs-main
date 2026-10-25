"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setMessage("请输入用户名和密码");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login") await login(username.trim(), password);
      else await register(username.trim(), password);
      router.push("/photowall");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <main className="w-full max-w-md mx-auto mt-32 px-4 relative z-10">
        <form
          onSubmit={submit}
          className="rounded-[40px] bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl p-8 md:p-10"
        >
          <div className="w-14 h-14 rounded-3xl bg-[var(--ui-accent)] flex items-center justify-center text-2xl shadow-lg mb-6 text-white">
            {mode === "login" ? <LogIn size={24} /> : <UserPlus size={24} />}
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            {mode === "login" ? "登录" : "注册"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-8">
            {mode === "login" ? "登录后可评论、点赞、查看原图" : "注册满 7 天后解锁上传与下载"}
          </p>

          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            用户名
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full mt-2 mb-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 px-5 py-3.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="至少 3 个字符"
          />

          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full mt-2 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 px-5 py-3.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="至少 6 个字符"
          />

          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary w-full mt-7 py-4 rounded-2xl disabled:opacity-50 font-black text-sm transition-all flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="animate-spin" size={16} />}
            {mode === "login" ? "登 录" : "注 册"}
          </button>

          <div className="mt-4 text-xs text-red-400 min-h-[18px] font-bold text-center">{message}</div>

          <div className="mt-6 flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
              }}
              className="text-indigo-500 hover:underline"
            >
              {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
            </button>
            <Link href="/" className="text-slate-500 hover:text-indigo-500">
              返回首页
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
