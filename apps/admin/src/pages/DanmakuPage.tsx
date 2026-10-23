import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";

interface Danmaku {
  id: number;
  userId: number | null;
  username: string | null;
  text: string;
  ipHash: string;
  createdAt: string;
}

export default function DanmakuPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Danmaku[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.adminDanmaku();
      if (!res.success) throw new Error(res.message);
      setItems(res.data || []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        (item.username || "").toLowerCase().includes(q) ||
        item.ipHash.toLowerCase().includes(q)
    );
  }, [items, query]);

  const remove = async (item: Danmaku) => {
    if (!confirm(`删除这条弹幕？\n\n${item.text}`)) return;
    try {
      await api.deleteDanmaku(item.id);
      showToast("已删除", "success");
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "删除失败", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <MessageSquareText className="text-indigo-400" /> 弹幕管理
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">
            当前最多保留 500 条；超出后自动删除最早弹幕。发现恶意内容可直接删除。
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-xs font-black flex items-center gap-2 hover:bg-white/10"
        >
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索弹幕内容、用户名或 IP 哈希..."
          className="w-full md:max-w-md rounded-2xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        <div className="text-[11px] text-slate-500 font-bold">
          共 {items.length} 条 / 显示 {filtered.length} 条
        </div>
      </div>

      {loading && <div className="text-slate-400 text-sm">加载中...</div>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500 font-bold">暂无弹幕</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-black text-white break-words">{item.text}</div>
                <div className="text-[10px] text-slate-500 mt-2">
                  #{item.id} · {item.username || "匿名"} · IP {item.ipHash || "-"} · {item.createdAt}
                </div>
              </div>
              <button
                onClick={() => void remove(item)}
                className="shrink-0 p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                title="删除弹幕"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
