import { useEffect, useMemo, useState } from "react";
import { FolderTree, Loader2, Plus, Trash2 } from "lucide-react";
import { api, type Category } from "../lib/api";
import { useToast } from "../components/ToastProvider";

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getCategories();
      setItems(res.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "加载分类失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const parents = useMemo(() => items.filter((item) => item.depth < 4), [items]);

  const create = async () => {
    if (!name.trim()) {
      showToast("请填写分类名称", "warning");
      return;
    }
    setBusy(true);
    try {
      await api.createCategory({
        name: name.trim(),
        parentId: parentId ? Number(parentId) : null,
      });
      setName("");
      setParentId("");
      showToast("分类已创建", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "创建失败", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: Category) => {
    if (!window.confirm(`删除分类「${item.name}」？`)) return;
    try {
      await api.deleteCategory(item.id);
      showToast("分类已删除", "success");
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除失败", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-black text-white">分类</h1>
        <p className="mt-1 text-sm font-bold text-slate-400">最多 4 级；文章必须选择根分类，深层分类可选。</p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-end">
        <label className="flex-1 text-xs font-black text-slate-400">
          分类名称
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：前端 / React"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="text-xs font-black text-slate-400 md:w-64">
          上级分类
          <select
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">根分类</option>
            {parents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.path}
              </option>
            ))}
          </select>
        </label>
        <button onClick={create} disabled={busy} className="btn btn-primary flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black disabled:opacity-50">
          <Plus size={14} /> 新建分类
        </button>
      </div>

      {loading && <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={16} />加载中…</div>}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4 last:border-0">
            <div className="flex min-w-0 items-center gap-3">
              <FolderTree size={15} className="shrink-0 text-indigo-400" />
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-white">{item.name}</div>
                <div className="truncate text-[10px] font-mono text-slate-500">{item.path} · L{item.depth}</div>
              </div>
            </div>
            <button onClick={() => remove(item)} className="rounded-xl bg-red-500/10 px-3 py-2 text-[10px] font-black text-red-300 hover:bg-red-500/20">
              <Trash2 size={12} className="mr-1 inline" />删除
            </button>
          </div>
        ))}
      </div>
      {!loading && items.length === 0 && <div className="py-16 text-center text-sm font-bold text-slate-500">暂无分类，先创建根分类。</div>}
    </div>
  );
}
