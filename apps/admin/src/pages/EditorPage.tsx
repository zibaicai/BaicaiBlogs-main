import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import RichTextEditor, { type RichTextEditorHandle } from "../components/editor/RichTextEditor";
import MetaMatrix from "../components/editor/MetaMatrix";
import FloatingImageTool from "../components/editor/FloatingImageTool";
import { useToast } from "../components/ToastProvider";
import { api, type Category, type Tag } from "../lib/api";

export default function EditorPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const docId = slug || "new";
  const isNew = docId === "new";

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [libraryTags, setLibraryTags] = useState<Tag[]>([]);

  const [historyTags, setHistoryTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [imageToolOpen, setImageToolOpen] = useState(false);
  const [imageTarget, setImageTarget] = useState<"editor" | "cover">("editor");

  const editorRef = useRef<RichTextEditorHandle>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [historyRes, categoryRes, tagRes] = await Promise.all([
          api.getAllTags(),
          api.getCategories(),
          api.getTags(),
        ]);
        if (!active) return;
        if (historyRes.success) setHistoryTags(historyRes.data || []);
        if (categoryRes.success) setCategories(categoryRes.data || []);
        if (tagRes.success) {
          setLibraryTags(tagRes.data || []);
          const activeNames = (tagRes.data || []).filter((tag) => tag.status === "ACTIVE").map((tag) => tag.name);
          setHistoryTags((current) => [...new Set([...activeNames, ...current])]);
        }
      } catch {
        /* 标签历史失败不影响写作 */
      } finally {
        if (active) setIsLoadingTags(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    let active = true;
    api.recommendTags(Number(categoryId))
      .then((res) => {
        if (active && res.success) {
          setHistoryTags((current) => [...new Set([...(res.data || []), ...current])]);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [categoryId]);

  useEffect(() => {
    if (isNew) return;
    let active = true;
    (async () => {
      setLoadingDoc(true);
      try {
        const res = await api.getMyPostBySlug(docId);
        if (!active) return;
        if (!res.success || !res.data) throw new Error(res.message || "文章不存在");
        const post = res.data;
        setTitle(post.title || "");
        setTags(post.tags || []);
        setCover(post.cover || "");
        setSummary(post.description || "");
        setContent(post.content || "");
        setDate(post.date ? String(post.date).slice(0, 10) : new Date().toISOString().slice(0, 10));
        setCategoryId(post.categoryId ? String(post.categoryId) : "");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "加载失败", "error");
      } finally {
        if (active) setLoadingDoc(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [docId, isNew, showToast]);

  const handleSave = async (isPublish: boolean) => {
    if (!title.trim()) {
      showToast("请填写文章标题", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: summary,
        content: editorRef.current?.getContent() || content,
        cover,
        date: `${date || new Date().toISOString().slice(0, 10)}T00:00:00`,
        status: isPublish ? "PUBLISHED" : "DRAFT",
        tags,
        categoryId: categoryId ? Number(categoryId) : null,
      };

      if (isNew) {
        const newSlug = `post_${Date.now()}`;
        const res = await api.createPost({ ...payload, slug: newSlug });
        if (!res.success) throw new Error(res.message || "创建失败");
        showToast(isPublish ? "🚀 文章已发布" : "💾 草稿已创建", "success");
        navigate(`/editor/${encodeURIComponent(newSlug)}`, { replace: true });
      } else {
        const res = await api.updatePost(docId, payload);
        if (!res.success) throw new Error(res.message || "保存失败");
        showToast(isPublish ? "🚀 文章已发布" : "💾 草稿已保存", "success");
      }
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      showToast(`保存失败：${message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-slate-400">
        <Loader2 className="animate-spin" /> 正在加载文章...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 lg:px-8">
      <div className="max-w-[1750px] mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/posts")}
            className="px-5 py-2.5 rounded-2xl bg-white/40 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} className="text-indigo-400" /> 返回文章
          </button>
          <div className="text-xs font-bold text-slate-500">
            {isNew ? "新建文章" : `编辑：${docId}`}
            {lastSaved && <span className="ml-3 text-emerald-400">最近保存 {lastSaved}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">分类</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="min-w-[220px] rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-bold text-white outline-none"
          >
            <option value="">未分类 / 请选择根分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.path}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500">必选一个分类；深层子分类可选。</span>
          {libraryTags.length > 0 && (
            <span className="ml-auto text-[10px] text-slate-500">标签库 {libraryTags.filter((tag) => tag.status === "ACTIVE").length} 个</span>
          )}
        </div>

        <div className="flex flex-col xl:flex-row gap-5" style={{ minHeight: "calc(100vh - 120px)" }}>
          <section className="flex-1 bg-white/30 dark:bg-slate-800/40 backdrop-blur-[60px] rounded-[40px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden min-h-[70vh]">
            <RichTextEditor
              ref={editorRef}
              title={title}
              setTitle={setTitle}
              initialContent={content}
              isTitleLocked={false}
              summary={summary}
              setSummary={setSummary}
              onOpenImageTool={() => {
                setImageTarget("editor");
                setImageToolOpen(true);
              }}
              onChange={() => undefined}
            />
          </section>

          <aside className="w-full xl:w-[360px] shrink-0 bg-white/30 dark:bg-slate-800/40 backdrop-blur-[60px] rounded-[40px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden">
            <MetaMatrix
              type="post"
              tags={tags}
              setTags={setTags}
              cover={cover}
              setCover={setCover}
              summary={summary}
              setSummary={setSummary}
              allHistoryPostTags={historyTags}
              allHistoryChatterTags={[]}
              isLoadingTags={isLoadingTags}
              allHistoryMoods={["开心", "疲惫", "平静", "激动", "Emo"]}
              onSave={handleSave}
              isSaving={isSaving}
              lastSaved={lastSaved}
              onOpenImageTool={() => {
                setImageTarget("cover");
                setImageToolOpen(true);
              }}
            />
          </aside>
        </div>
      </div>

      <FloatingImageTool
        isOpen={imageToolOpen}
        onClose={() => setImageToolOpen(false)}
        onInsert={(url) => {
          if (imageTarget === "editor") {
            editorRef.current?.insertImage(url);
            if (!cover) setCover(url);
          } else {
            setCover(url);
            setImageToolOpen(false);
          }
        }}
      />
    </div>
  );
}
