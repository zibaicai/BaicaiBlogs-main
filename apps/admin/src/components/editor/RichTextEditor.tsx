"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "tiptap-markdown";
import { all, createLowlight } from "lowlight";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Lock,
  Palette,
  Pipette,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Type,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from "lucide-react";

const lowlight = createLowlight(all);

const WidthImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        renderHTML: (attributes: { width?: string }) => ({
          style: `width:${attributes.width || "100%"};height:auto;display:block;margin:2rem auto;border-radius:1.5rem;box-shadow:0 18px 40px rgba(15,23,42,.16);`,
        }),
      },
    };
  },
});

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]+/g, ""),
            renderHTML: (attributes: { fontSize?: string }) =>
              attributes.fontSize ? { style: `font-size:${attributes.fontSize}` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize }).run(),
    };
  },
});

type ColorDialogProps = {
  initial: string;
  recents: string[];
  onConfirm: (color: string) => void;
  onClose: () => void;
};

const COLOR_PRESETS = ["#111827", "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

function ColorDialog({ initial, recents, onConfirm, onClose }: ColorDialogProps) {
  const [value, setValue] = useState(initial || "#6366f1");

  return (
    <>
      <button
        type="button"
        aria-label="关闭颜色选择"
        onClick={onClose}
        className="fixed inset-0 z-[9990] cursor-default bg-slate-950/20 backdrop-blur-sm dark:bg-black/40"
      />
      <div className="fixed left-1/2 top-1/2 z-[9999] w-72 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/40 bg-white/95 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Color</span>
          <button
            type="button"
            onClick={() => onConfirm(value)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:scale-105"
            aria-label="确认颜色"
          >
            <Check size={16} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue(color)}
              className={`aspect-square rounded-xl border-2 transition hover:scale-105 ${
                value.toLowerCase() === color.toLowerCase()
                  ? "border-slate-900 dark:border-white"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              aria-label={color}
            />
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-slate-400">#</span>
          <input
            value={value.replace("#", "")}
            onChange={(event) => setValue(`#${event.target.value}`)}
            className="w-full bg-transparent font-mono text-xs font-bold uppercase text-slate-700 outline-none dark:text-slate-200"
            maxLength={6}
          />
          <span className="h-5 w-5 rounded-full border border-white/60" style={{ backgroundColor: value }} />
        </label>

        {recents.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-700/60">
            {recents.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue(color)}
                className="h-6 w-6 rounded-full border border-white/60 shadow-sm transition hover:scale-110"
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={12} /> 关闭
        </button>
      </div>
    </>
  );
}

export interface RichTextEditorHandle {
  insertImage: (url: string) => void;
  getContent: () => string;
}

interface EditorProps {
  title: string;
  setTitle: (value: string) => void;
  initialContent?: string;
  contentType?: "markdown" | "html";
  plainImages?: boolean;
  onOpenImageTool: () => void;
  isTitleLocked?: boolean;
  summary?: string;
  setSummary?: (value: string) => void;
  onChange?: () => void;
}

function ToolButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        active
          ? "bg-indigo-500 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-700/60"
      }`}
    >
      {children}
    </button>
  );
}

const RichTextEditor = forwardRef<RichTextEditorHandle, EditorProps>(
  (
    {
      title,
      setTitle,
      initialContent,
      contentType = "markdown",
      plainImages = false,
      onOpenImageTool,
      isTitleLocked,
      summary,
      setSummary,
      onChange,
    },
    ref
  ) => {
    const [textColors, setTextColors] = useState(["#6366f1", "#111827"]);
    const [highlightColors, setHighlightColors] = useState(["#fef08a", "#bbf7d0"]);
    const [picker, setPicker] = useState<"text" | "highlight" | null>(null);
    const [, bumpToolbar] = useState(0);
    const loaded = useRef<string | null>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
        CodeBlockLowlight.configure({
          lowlight,
          defaultLanguage: "cpp",
          HTMLAttributes: {
            class:
              "my-6 overflow-x-auto rounded-2xl bg-[#282c34] p-6 font-mono text-[#abb2bf] shadow-inner",
          },
        }),
        Underline,
        Subscript,
        Superscript,
        TextStyle,
        Color,
        FontSize,
        plainImages ? Image : WidthImage,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "cursor-pointer font-bold text-indigo-500 underline" },
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Highlight.configure({ multicolor: true }),
        TaskList.configure({ HTMLAttributes: { class: "not-prose space-y-3" } }),
        TaskItem.configure({ nested: true }),
        Markdown.configure({ html: true, tightLists: true, linkify: false, breaks: false }),
      ],
      content: "",
      immediatelyRender: false,
      onUpdate: () => onChange?.(),
      onTransaction: () => bumpToolbar((value) => value + 1),
      editorProps: {
        attributes: {
          class:
            "editor-content-area prose prose-slate dark:prose-invert prose-lg max-w-none min-h-full w-full px-4 pb-60 font-serif leading-relaxed focus:outline-none",
        },
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        insertImage: (url: string) => {
          if (!editor) return;
          editor.chain().focus().setImage({ src: url }).run();
          onChange?.();
        },
        getContent: () => {
          if (!editor) return "";
          if (contentType === "html") return editor.getHTML();
          return ((editor.storage as any).markdown?.getMarkdown?.() || "").trim();
        },
      }),
      [editor, onChange, contentType]
    );

    useEffect(() => {
      if (!editor || !initialContent || loaded.current === initialContent) return;
      const parser = (editor.storage as any).markdown?.parser;
      const parsed =
        contentType === "html" ? initialContent : parser ? parser.parse(initialContent) : initialContent;
      editor.commands.setContent(parsed, { emitUpdate: false });
      loaded.current = initialContent;
    }, [editor, initialContent, contentType]);

    if (!editor) return null;

    const fontSize = editor.getAttributes("textStyle").fontSize || "default";

    const setLink = () => {
      if (editor.isActive("link")) {
        editor.chain().focus().unsetLink().run();
        return;
      }
      const current = editor.getAttributes("link").href || "";
      const input = window.prompt("请输入链接 URL：", current);
      if (input === null) return;
      if (!input.trim()) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      const href = /^https?:\/\//i.test(input) ? input : `https://${input}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    };

    return (
      <div className="relative flex h-full min-h-0 w-full flex-col bg-transparent">
        <style>{`
          .editor-content-area h1 { font-size:3rem !important; font-weight:900 !important; margin:3rem 0 2rem !important; line-height:1.1; }
          .editor-content-area h2 { font-size:2.2rem !important; font-weight:800 !important; margin:2rem 0 1.5rem !important; }
          .editor-content-area h3 { font-size:1.5rem !important; font-weight:700 !important; margin:0 0 1rem !important; }
          .editor-content-area p { font-size:1.15rem !important; line-height:1.85 !important; }
          .editor-content-area ul { list-style:disc !important; padding-left:1.5rem !important; }
          .editor-content-area ol { list-style:decimal !important; padding-left:1.5rem !important; }
          .editor-content-area s, .editor-content-area del { text-decoration:line-through !important; opacity:.6; }
          .editor-content-area blockquote { border-left:4px solid var(--ui-accent,#6366f1) !important; background:color-mix(in srgb,var(--ui-accent,#6366f1) 7%,transparent) !important; padding:1rem 1.5rem !important; margin:1.5rem 0 !important; border-radius:0 1.25rem 1.25rem 0 !important; }
          .editor-content-area p code { background:color-mix(in srgb,var(--ui-accent,#6366f1) 12%,transparent) !important; color:var(--ui-accent,#6366f1) !important; padding:.2rem .4rem !important; border-radius:.45rem !important; font-size:.85em !important; }
          .editor-content-area pre code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace !important; }
        `}</style>

        <div className="flex shrink-0 items-center gap-4 px-10 pb-4 pt-12">
          <input
            value={title}
            onChange={(event) => !isTitleLocked && setTitle(event.target.value)}
            readOnly={isTitleLocked}
            placeholder="文章大标题..."
            className={`flex-1 border-none bg-transparent text-4xl font-black tracking-tight outline-none md:text-5xl ${
              isTitleLocked
                ? "cursor-default select-none text-slate-400 dark:text-slate-600"
                : "text-slate-900 placeholder:text-slate-200 dark:text-white dark:placeholder:text-slate-800"
            }`}
          />
          {isTitleLocked && (
            <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-700 dark:bg-slate-800">
              <Lock size={14} /> Locked
            </span>
          )}
        </div>

        {setSummary && (
          <div className="shrink-0 px-10 pb-3">
            <textarea
              value={summary || ""}
              onChange={(event) => setSummary(event.target.value)}
              rows={2}
              maxLength={200}
              placeholder="文章摘要：显示在标题下方、首页卡片和搜索结果中"
              className="w-full resize-none rounded-xl border border-white/30 bg-white/30 px-4 py-3 text-xs font-medium leading-relaxed text-slate-700 outline-none backdrop-blur-md transition focus:ring-2 focus:ring-indigo-500/40 dark:border-white/10 dark:bg-slate-900/30 dark:text-slate-200"
            />
            <div className="mt-1 text-right text-[9px] font-bold text-slate-400">
              {(summary || "").length}/200
            </div>
          </div>
        )}

        <div className="z-50 flex shrink-0 flex-wrap items-center gap-1 border-y border-white/20 bg-white/10 px-6 py-2 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
          <ToolButton onClick={() => editor.chain().focus().undo().run()} title="撤销"><Undo2 size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().redo().run()} title="重做"><Redo2 size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="清除格式"><RemoveFormatting size={15} /></ToolButton>

          <span className="mx-1 h-6 w-px bg-slate-400/20" />

          <label className="flex items-center gap-1 rounded-lg bg-black/5 px-2 dark:bg-white/5">
            <Type size={12} className="text-slate-400" />
            <select
              value={fontSize}
              onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
              className="h-8 bg-transparent px-1 text-[10px] font-bold outline-none"
              aria-label="字号"
            >
              <option value="default">字号</option>
              {["14px", "16px", "18px", "20px", "24px", "32px", "48px"].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>

          <span className="mx-1 h-6 w-px bg-slate-400/20" />

          <ToolButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="正文"><Type size={16} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="一级标题"><Heading1 size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="二级标题"><Heading2 size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="三级标题"><Heading3 size={15} /></ToolButton>

          <span className="mx-1 h-6 w-px bg-slate-400/20" />

          <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="加粗"><Bold size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="斜体"><Italic size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="下划线"><UnderlineIcon size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="删除线"><Strikethrough size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="代码块"><Code2 size={15} /></ToolButton>

          <span className="mx-1 h-6 w-px bg-slate-400/20" />

          <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="左对齐"><AlignLeft size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="居中"><AlignCenter size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="右对齐"><AlignRight size={15} /></ToolButton>

          <span className="mx-1 h-6 w-px bg-slate-400/20" />

          <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="无序列表"><List size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="有序列表"><ListOrdered size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="任务列表"><ListTodo size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="引用"><Quote size={15} /></ToolButton>

          <span className="mx-1 h-6 w-px bg-slate-400/20" />

          <ToolButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="上标"><SupIcon size={15} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="下标"><SubIcon size={15} /></ToolButton>
          <ToolButton onClick={setLink} active={editor.isActive("link")} title="链接"><Link2 size={15} /></ToolButton>
          <ToolButton onClick={onOpenImageTool} title="插入图片"><ImageIcon size={15} className="text-indigo-500" /></ToolButton>

          {editor.isActive("image") && (
            <div className="ml-2 flex items-center gap-1 rounded-lg border border-dashed border-indigo-500/20 bg-indigo-500/10 px-2 py-1">
              {["25%", "50%", "75%", "100%"].map((width) => (
                <button
                  key={width}
                  type="button"
                  onClick={() => editor.chain().focus().updateAttributes("image", { width }).run()}
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold transition hover:bg-white/70"
                >
                  {width}
                </button>
              ))}
            </div>
          )}

          <span className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-black/5 px-2 py-1 dark:bg-white/5">
              <Palette size={13} className="text-slate-400" />
              {textColors.slice(0, 3).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="h-4 w-4 rounded-full border border-white/50 transition hover:scale-110"
                  style={{ backgroundColor: color }}
                  aria-label={`文字颜色 ${color}`}
                />
              ))}
              <button type="button" onClick={() => setPicker("text")} className="ml-1 text-indigo-500" aria-label="选择文字颜色">
                <Pipette size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-black/5 px-2 py-1 dark:bg-white/5">
              <Highlighter size={13} className="text-slate-400" />
              {highlightColors.slice(0, 2).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor.chain().focus().setHighlight({ color }).run()}
                  className="h-4 w-4 rounded-md border border-white/50 transition hover:scale-110"
                  style={{ backgroundColor: color }}
                  aria-label={`高亮 ${color}`}
                />
              ))}
              <button type="button" onClick={() => setPicker("highlight")} className="ml-1 text-amber-500" aria-label="选择高亮颜色">
                <Highlighter size={14} />
              </button>
            </div>
          </div>
        </div>

        {picker && (
          <ColorDialog
            initial={picker === "text" ? textColors[0] : highlightColors[0]}
            recents={picker === "text" ? textColors : highlightColors}
            onClose={() => setPicker(null)}
            onConfirm={(color) => {
              if (picker === "text") {
                editor.chain().focus().setColor(color).run();
                setTextColors((current) => [color, ...current.filter((item) => item !== color)].slice(0, 6));
              } else {
                editor.chain().focus().setHighlight({ color }).run();
                setHighlightColors((current) => [color, ...current.filter((item) => item !== color)].slice(0, 6));
              }
              setPicker(null);
            }}
          />
        )}

        <div className="custom-scrollbar flex-1 overflow-y-auto px-10 py-10">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
export default RichTextEditor;
