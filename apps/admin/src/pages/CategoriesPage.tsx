import { useEffect, useMemo, useState } from "react";
import { FolderTree, Loader2, Plus, Trash2 } from "lucide-react";
import { api, type Category } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Card, Input, Select } from "../components/ui";

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

      <Card className="p-5" padded={false}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Input
              label="分类名称"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：前端 / React"
            />
          </div>
          <div className="md:w-64">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">上级分类</span>
            <Select
              value={parentId}
              onChange={setParentId}
              ariaLabel="上级分类"
              options={[
                { value: "", label: "根分类" },
                ...parents.map((item) => ({ value: String(item.id), label: item.path })),
              ]}
            />
          </div>
          <Button onClick={create} disabled={busy} className="shrink-0">
            <Plus size={14} /> 新建分类
          </Button>
        </div>
      </Card>

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
