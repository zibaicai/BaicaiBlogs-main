import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { api, type Moment } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Dialog, Input, Select, Textarea } from "../components/ui";

type MomentDraft = {
  content: string;
  images: string;
  date: string;
  status: "DRAFT" | "PUBLISHED";
  visibility: "PUBLIC" | "PRIVATE";
};

const emptyDraft = (): MomentDraft => ({
  content: "",
  images: "",
  date: new Date().toISOString().slice(0, 10),
  status: "DRAFT",
  visibility: "PRIVATE",
});

export default function MomentsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "private" | "public">("all");
  const [editing, setEditing] = useState<Moment | null>(null);
  const [draft, setDraft] = useState<MomentDraft>(emptyDraft());
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.myMoments();
      setItems(res.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter === "all") return true;
      if (filter === "draft") return item.status === "DRAFT";
      if (filter === "private") return item.status === "PUBLISHED" && item.visibility === "PRIVATE";
      return item.status === "PUBLISHED" && item.visibility === "PUBLIC";
    });
  }, [items, filter]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  };

  const openEdit = (item: Moment) => {
    setEditing(item);
    setDraft({
      content: item.content || "",
      images: (item.images || []).join("\n"),
      date: item.date ? String(item.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: item.status === "DRAFT" ? "DRAFT" : "PUBLISHED",
      visibility: item.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!draft.content.trim()) {
      showToast("请填写说说内容", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        content: draft.content,
        images: draft.images.split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
        date: `${draft.date}T00:00:00`,
        status: draft.status,
        visibility: draft.status === "DRAFT" ? "PRIVATE" : draft.visibility,
      };
      if (editing) {
        await api.updateMoment(editing.slug, payload);
      } else {
        await api.createMoment({ ...payload, slug: `moment_${Date.now()}` });
      }
      setFormOpen(false);
      showToast("说说已保存", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Moment) => {
    if (!window.confirm("删除这条说说？")) return;
    try {
      await api.deleteMoment(item.slug);
      showToast("已删除", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">说说</h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">草稿仅自己可见，私密说说仅拥有者可见</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600">
          <Plus size={16} /> 新建说说
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "全部", items.length],
          ["draft", "草稿", items.filter((item) => item.status === "DRAFT").length],
          ["private", "私密", items.filter((item) => item.status === "PUBLISHED" && item.visibility === "PRIVATE").length],
          ["public", "公开", items.filter((item) => item.status === "PUBLISHED" && item.visibility === "PUBLIC").length],
        ].map(([value, label, count]) => (
          <button
            key={value}
            onClick={() => setFilter(value as typeof filter)}
            className={`rounded-full px-4 py-2 text-xs font-black transition-colors ${
              filter === value ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            {label} <span className="opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={16} />加载中…</div>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map((item) => (
          <div key={item.slug} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-slate-500">{item.slug}</div>
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-300">
                  {(item.content || "").replace(/[#*`>\[\]]/g, "").slice(0, 260)}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${
                item.status === "DRAFT"
                  ? "bg-amber-500/15 text-amber-300"
                  : item.visibility === "PRIVATE"
                  ? "bg-red-500/15 text-red-300"
                  : "bg-emerald-500/15 text-emerald-300"
              }`}>
                {item.status === "DRAFT" ? "草稿" : item.visibility === "PRIVATE" ? "私密" : "公开"}
              </span>
            </div>
            {item.images?.length > 0 && <div className="mt-3 flex gap-2 overflow-hidden">{item.images.slice(0, 3).map((url) => <img key={url} src={url} alt="" className="h-14 w-14 rounded-xl object-cover" />)}</div>}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">{String(item.date || "").slice(0, 10)}</span>
              <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="rounded-xl bg-white/5 px-3 py-2 text-[10px] font-black text-slate-300 hover:bg-white/10"><Pencil size={12} className="mr-1 inline" />编辑</button>
                <button onClick={() => remove(item)} className="rounded-xl bg-red-500/10 px-3 py-2 text-[10px] font-black text-red-300 hover:bg-red-500/20"><Trash2 size={12} className="mr-1 inline" />删除</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && <div className="py-16 text-center text-sm font-bold text-slate-500">暂无说说</div>}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑说说" : "新建说说"}
        description="支持 Markdown；草稿仅自己可见，私密说说仅拥有者可见。"
        widthClassName="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={save} disabled={saving}>{saving ? "保存中…" : "保存"}</Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <Textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={9} placeholder="说说内容，支持 Markdown" />
          <Textarea value={draft.images} onChange={(e) => setDraft({ ...draft, images: e.target.value })} rows={3} placeholder="图片 URL，每行一个（可空）" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            <Select
              value={draft.status}
              onChange={(value) => setDraft({ ...draft, status: value as MomentDraft["status"] })}
              ariaLabel="说说状态"
              options={[
                { value: "DRAFT", label: "保存为草稿" },
                { value: "PUBLISHED", label: "发布" },
              ]}
            />
            <Select
              value={draft.visibility}
              onChange={(value) => setDraft({ ...draft, visibility: value as MomentDraft["visibility"] })}
              disabled={draft.status === "DRAFT"}
              ariaLabel="说说可见性"
              options={[
                { value: "PRIVATE", label: "私密" },
                { value: "PUBLIC", label: "公开" },
              ]}
            />
            <div className="flex items-center gap-2 text-[10px] text-slate-400"><ImagePlus size={13} /> 图片可为空</div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
