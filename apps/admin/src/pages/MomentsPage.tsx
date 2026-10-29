import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { api, type Moment } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button, Dialog, Input, MediaField, Select, Textarea } from "../components/ui";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  FilterTabs,
  FormActions,
  FormField,
  StatusBadge,
} from "../components/admin/AdminUI";
import { DataTable } from "../components/admin/DataTable";

type MomentDraft = {
  content: string;
  images: string[];
  date: string;
  status: "DRAFT" | "PUBLISHED";
  visibility: "PUBLIC" | "PRIVATE";
};

const emptyDraft = (): MomentDraft => ({
  content: "",
  images: [],
  date: new Date().toISOString().slice(0, 10),
  status: "DRAFT",
  visibility: "PRIVATE",
});

const previewText = (content: string) => (content || "").replace(/[#*`>\[\]]/g, "").slice(0, 260);

function VisibilityBadge({ visibility }: { visibility: string }) {
  const isPrivate = visibility === "PRIVATE";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
        isPrivate ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-300"
      }`}
    >
      {isPrivate ? "私密" : "公开"}
    </span>
  );
}

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
      images: item.images || [],
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
        images: draft.images,
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
    <AdminPageShell>
      <AdminPageHeader
        title="说说"
        description="草稿仅自己可见，私密说说仅拥有者可见"
        actions={
          <>
            <Button variant="ghost" onClick={() => void load()}>
              <RefreshCw size={13} /> 刷新
            </Button>
            <Button onClick={openCreate}>
              <Plus size={13} /> 新建说说
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <FilterTabs
          value={filter}
          onChange={(value) => setFilter(value as typeof filter)}
          options={[
            { value: "all", label: "全部", count: items.length },
            { value: "draft", label: "草稿", count: items.filter((item) => item.status === "DRAFT").length },
            {
              value: "private",
              label: "私密",
              count: items.filter((item) => item.status === "PUBLISHED" && item.visibility === "PRIVATE").length,
            },
            {
              value: "public",
              label: "公开",
              count: items.filter((item) => item.status === "PUBLISHED" && item.visibility === "PUBLIC").length,
            },
          ]}
        />
        <span className="ml-auto text-[10px] text-slate-500">
          共 {items.length} 条 · 当前 {filtered.length} 条
        </span>
      </div>

      {!loading && items.length === 0 ? (
        <AdminEmptyState
          title="暂无说说"
          description="记录第一条说说，草稿仅自己可见。"
          action={
            <Button onClick={openCreate}>
              <Plus size={13} /> 新建说说
            </Button>
          }
        />
      ) : (
        <DataTable
          rows={filtered}
          loading={loading}
          rowKey={(item) => item.slug}
          empty="没有符合条件的说说"
          columns={[
            {
              key: "content",
              header: "内容",
              className: "max-w-[460px]",
              cell: (item) => (
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[11px] leading-5 text-slate-200">{previewText(item.content)}</p>
                  <p className="mt-0.5 truncate font-mono text-[9px] text-slate-600">{item.slug}</p>
                </div>
              ),
            },
            {
              key: "images",
              header: "图片",
              width: "120px",
              cell: (item) => (
                <div className="flex items-center gap-1">
                  {(item.images || []).slice(0, 3).map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="h-7 w-7 rounded-md border border-white/10 object-cover"
                    />
                  ))}
                  {(item.images?.length || 0) === 0 && <span className="text-slate-600">—</span>}
                  {(item.images?.length || 0) > 3 && (
                    <span className="text-[9px] font-bold text-slate-500">+{item.images.length - 3}</span>
                  )}
                </div>
              ),
            },
            {
              key: "status",
              header: "状态",
              width: "130px",
              cell: (item) => (
                <div className="flex flex-wrap items-center gap-1">
                  <StatusBadge status={item.status} />
                  {item.status !== "DRAFT" && <VisibilityBadge visibility={item.visibility} />}
                </div>
              ),
            },
            {
              key: "date",
              header: "日期",
              width: "100px",
              cell: (item) => (
                <span className="whitespace-nowrap text-[10px] text-slate-500">
                  {String(item.date || "").slice(0, 10) || "—"}
                </span>
              ),
            },
            {
              key: "actions",
              header: "操作",
              className: "text-right",
              width: "120px",
              cell: (item) => (
                <div className="flex justify-end gap-0.5">
                  <button
                    type="button"
                    title="编辑"
                    onClick={() => openEdit(item)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    title="删除"
                    onClick={() => void remove(item)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "编辑说说" : "新建说说"}
        description="支持 Markdown；草稿仅自己可见，私密说说仅拥有者可见。"
        widthClassName="max-w-2xl"
        footer={
          <FormActions>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </FormActions>
        }
      >
        <div className="grid gap-3">
          <Textarea
            label="内容"
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            rows={7}
            placeholder="说说内容，支持 Markdown"
          />
          <MediaField
            label="说说图片"
            hint="支持 JPG / PNG / WebP，最多 9 张"
            value={draft.images}
            onChange={(images) => setDraft({ ...draft, images })}
            multiple
            max={9}
            kind="image"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="日期"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
            <FormField label="状态">
              <Select
                value={draft.status}
                onChange={(value) => setDraft({ ...draft, status: value as MomentDraft["status"] })}
                ariaLabel="说说状态"
                options={[
                  { value: "DRAFT", label: "保存为草稿" },
                  { value: "PUBLISHED", label: "发布" },
                ]}
              />
            </FormField>
            <FormField label="可见性">
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
            </FormField>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 sm:self-end">
              <ImagePlus size={13} /> 图片可为空，最多 9 张
            </div>
          </div>
        </div>
      </Dialog>
    </AdminPageShell>
  );
}
