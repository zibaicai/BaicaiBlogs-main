"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import Navbar from "../../../components/Navbar";
import PageTransition from "../../../components/PageTransition";
import { PageTitle } from "../../../components/ui/Typography";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";
import { roomApi, type RoomProfile } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function RoomSettingsPage() {
  const { user, loading } = useAuth();
  const [room, setRoom] = useState<RoomProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomBio, setRoomBio] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (!user) return;
    roomApi.mine()
      .then((response) => {
        setRoom(response.data);
        setNickname(response.data.nickname || "");
        setRoomName(response.data.roomName || "");
        setRoomBio(response.data.roomBio || "");
        setAvatar(response.data.avatar || "");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "加载失败"));
  }, [user]);

  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await roomApi.update({ nickname, roomName, roomBio, avatar });
      setRoom(response.data);
      setMessage("已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="directory-shell">
          <div className="mx-auto max-w-3xl">
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-500">
              <ArrowLeft size={14} /> 返回社区
            </Link>
            <header className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400">MY ROOM</p>
              <PageTitle className="mt-2 text-slate-900 dark:text-white">我的小屋</PageTitle>
              <p className="mt-2 text-sm text-slate-500">修改后，导航和首页会显示你的小屋名与昵称。</p>
            </header>

            {loading ? (
              <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-indigo-500" /></div>
            ) : !user ? (
              <section className="rounded-3xl border border-white/40 bg-white/60 p-8 text-center dark:border-white/10 dark:bg-slate-800/50">
                <p className="text-sm text-slate-500">登录后才能设置自己的小屋。</p>
                <Link href="/login?next=/account/room" className="hv-button hv-button-primary mt-4 inline-flex">去登录</Link>
              </section>
            ) : (
              <section className="space-y-5 rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/50 md:p-8">
                <label className="block text-xs font-bold text-slate-500">
                  昵称
                  <Input value={nickname} onChange={(event) => setNickname(event.target.value)} className="mt-2" placeholder="例如：叶洛" />
                </label>
                <label className="block text-xs font-bold text-slate-500">
                  小屋名
                  <Input value={roomName} onChange={(event) => setRoomName(event.target.value)} className="mt-2" placeholder="例如：叶洛" />
                  <span className="mt-1 block text-[10px] font-normal text-slate-400">留空时显示昵称，不会自动添加其他文字。</span>
                </label>
                <label className="block text-xs font-bold text-slate-500">
                  小屋简介
                  <Textarea value={roomBio} onChange={(event) => setRoomBio(event.target.value)} rows={4} className="mt-2" placeholder="介绍一下你的小屋。" />
                </label>
                <label className="block text-xs font-bold text-slate-500">
                  头像地址
                  <Input value={avatar} onChange={(event) => setAvatar(event.target.value)} className="mt-2" placeholder="https://... 或 /avatar.jpg" />
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => void save()} disabled={busy} className="hv-button hv-button-primary inline-flex items-center gap-2 disabled:opacity-50">
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 保存小屋
                  </button>
                  {room && <Link href={`/u/${encodeURIComponent(room.username)}`} className="hv-button">查看我的小屋</Link>}
                  {message && <span className="text-xs text-slate-500">{message}</span>}
                </div>
              </section>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
