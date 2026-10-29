"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderTree, Plus, RefreshCw, Trash2 } from "lucide-react";

import { api, type Category } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Input, Select } from "../components/ui";
import { AdminEmptyState, AdminLoading, AdminPageHeader, AdminPageShell, FormField } from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

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
    <AdminPageShell>
      <AdminPageHeader
        title="分类"
        description="最多 4 级；文章必须选择根分类，深层分类可选。"
        actions={
          <>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400">
              共 {items.length} 个
            </span>
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> 刷新
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="min-w-0 flex-1">
            <FormField label="分类名称">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：前端 / React"
              />
            </FormField>
          </div>
          <div className="md:w-64">
            <FormField label="上级分类">
              <Select
                value={parentId}
                onChange={setParentId}
                ariaLabel="上级分类"
                options={[
                  { value: "", label: "根分类" },
                  ...parents.map((item) => ({ value: String(item.id), label: item.path })),
                ]}
              />
            </FormField>
          </div>
          <Button onClick={create} disabled={busy} className="shrink-0">
            <Plus size={13} /> 新建分类
          </Button>
        </div>
      </div>

      {loading ? (
        <AdminLoading />
      ) : items.length === 0 ? (
        <AdminEmptyState title="暂无分类，先创建根分类。" />
      ) : (
        <DataTable
          rows={items}
          rowKey={(item) => item.id}
          columns={[
            {
              key: "name",
              header: "分类",
              className: "max-w-[240px]",
              cell: (item) => (
                <div className="flex min-w-0 items-center gap-2">
                  <FolderTree size={13} className="shrink-0 text-indigo-400" />
                  <span className="truncate font-bold text-slate-100">{item.name}</span>
                </div>
              ),
            },
            {
              key: "path",
              header: "路径",
              className: "max-w-[280px]",
              cell: (item) => (
                <span className="block truncate font-mono text-[10px] text-slate-500" title={item.path}>
                  {item.path}
                </span>
              ),
            },
            {
              key: "depth",
              header: "层级",
              width: "70px",
              cell: (item) => (
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                  L{item.depth}
                </span>
              ),
            },
            {
              key: "action",
              header: "操作",
              className: "text-right",
              width: "64px",
              cell: (item) => (
                <button
                  type="button"
                  onClick={() => void remove(item)}
                  title="删除分类"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
              ),
            },
          ]}
        />
      )}
    </AdminPageShell>
  );
}
