"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

import Textarea from "./ui/Textarea";
import { formatDate, type FriendMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useFeedback } from "./FeedbackProvider";
import { useToast } from "./ToastProvider";
import { useFriendsVerification } from "./friends/FriendsVerificationProvider";
import MessageListShell from "./messages/MessageListShell";
import MessageItemShell from "./messages/MessageItemShell";

export default function FriendGuestbook({ initialMessages }: { initialMessages: FriendMessage[] }) {
  const { user } = useAuth();
  const { confirm } = useFeedback();
  const { showToast } = useToast();
  const { ensureVerified, requestVerification, refreshStatus } = useFriendsVerification();
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const remove = async (id: number) => {
    const ok = await confirm({
      kind: "warning",
      title: "删除这条留言？",
      description: "删除后无法恢复。",
      confirmText: "删除",
      cancelText: "取消",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/user/friend-messages/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "删除失败");
      setMessages((current) => current.filter((message) => message.id !== id));
      showToast("留言已删除", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  const submit = async () => {
    if (!content.trim()) {
      showToast("请先写点什么", "warning");
      return;
    }
    const verified = await ensureVerified();
    if (!verified) {
      showToast("请完成人机验证", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/public/friend-messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "提交失败");
      if (json.data) setMessages((current) => [json.data, ...current]);
      showToast("留言已发布", "success");
      setContent("");
      await refreshStatus();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "提交失败", "error");
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <MessageListShell
      className="friend-guestbook"
      title="留言"
      description="可以随便聊聊，也可以留下你的网站。"
      count={messages.length > 0 ? `${messages.length} 条` : undefined}
      icon={<MessageCircle size={20} />}
      surface="plain"
      density="compact"
      empty="还没有留言，来坐第一排。"
      beforeList={
        <div className="guestbook-composer">
          <p className="guestbook-composer-hint">
            {user ? `以 ${user.nickname || user.username} 的身份留言` : "当前为匿名留言"}
          </p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={requestVerification}
            rows={4}
            className="mt-1"
            placeholder="说点什么，或者留下你的网站。"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="hv-button hv-button-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 发表留言
            </button>
          </div>
        </div>
      }
    >
      {messages.map((message) => (
        <MessageItemShell
          key={message.id}
          avatar={message.avatar}
          fallback={message.name.slice(0, 1)}
          name={message.name}
          time={formatDate(message.createdAt || "")}
          meta={
            message.website ? (
              <a href={message.website} target="_blank" rel="nofollow ugc noopener noreferrer">
                {message.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            ) : undefined
          }
          actions={
            user && message.userId === user.id ? (
              <button type="button" onClick={() => void remove(message.id)}>
                删除
              </button>
            ) : undefined
          }
          density="compact"
        >
          {message.content}
        </MessageItemShell>
      ))}
    </MessageListShell>
  );
}
