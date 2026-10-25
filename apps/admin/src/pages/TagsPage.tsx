import { useEffect, useState } from "react";
import { Check, Hash, Loader2, Plus, X } from "lucide-react";
import { api, type Tag } from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function TagsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getTags();
      setItems(res.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载标签失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createTag(name.trim().replace(/^#/, ""));
      setName("");
      showToast("标签已创建", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "创建失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const approve = async (tag: Tag) => {
    try {
      await api.approveTag(tag.id);
      showToast("已通过，申请人会收到站内信", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "审批失败", "error");
    }
  };

  const reject = async (tag: Tag) => {
    const note = window.prompt("拒绝原因", "标签不符合当前分类体系");
    if (note === null) return;
    try {
      await api.rejectTag(tag.id, note);
      showToast("已拒绝，申请人会收到站内信", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "审批失败", "error");
    }
  };

  const pending = items.filter((item) => item.status === "PENDING");
  const active = items.filter((item) => item.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-black text-white">标签库</h1>
        <p className="mt-1 text-sm font-bold text-slate-400">完全扁平标签；用户申请后在这里审批，通过/拒绝都会发站内信。</p>
      </div>

      <div className="flex gap-2 rounded-3xl border border-white/10 bg-white/5 p-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="直接添加标签，例如 React"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={create} disabled={busy} className="btn btn-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black disabled:opacity-50">
          <Plus size={14} /> 添加
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-amber-300">待审批 {pending.length}</h2>
        {loading && <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={16} />加载中…</div>}
        <div className="grid gap-3 md:grid-cols-2">
          {pending.map((tag) => (
            <div key={tag.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-black text-white"><Hash size={14} />{tag.name}</div>
                <div className="flex gap-2">
                  <button onClick={() => approve(tag)} className="rounded-xl bg-emerald-500/15 px-3 py-2 text-[10px] font-black text-emerald-300"><Check size={12} className="mr-1 inline" />通过</button>
                  <button onClick={() => reject(tag)} className="rounded-xl bg-red-500/15 px-3 py-2 text-[10px] font-black text-red-300"><X size={12} className="mr-1 inline" />拒绝</button>
                </div>
              </div>
              {tag.reviewNote && <p className="mt-2 text-[10px] text-slate-400">申请理由：{tag.reviewNote}</p>}
            </div>
          ))}
        </div>
        {!loading && pending.length === 0 && <div className="rounded-2xl border border-white/5 bg-white/5 py-8 text-center text-xs text-slate-500">暂无待审批标签</div>}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">已启用 {active.length}</h2>
        <div className="flex flex-wrap gap-2">
          {active.map((tag) => (
            <span key={tag.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">#{tag.name}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
