"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export type ReadingAnchor = {
  id: string;
  text: string;
  level: number;
};

type ReadingContextValue = {
  contentRef: RefObject<HTMLDivElement | null>;
  anchors: ReadingAnchor[];
  activeAnchorId: string;
  scrollToAnchor: (id: string) => void;
};

const ReadingContext = createContext<ReadingContextValue | null>(null);

function slugifyHeading(text: string, index: number) {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `heading-${base || "section"}-${index}`;
}

export function ReadingProvider({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [anchors, setAnchors] = useState<ReadingAnchor[]>([]);
  const [activeAnchorId, setActiveAnchorId] = useState("");

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const collect = () => {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"));
      const next = nodes
        .map((node, index) => {
          const text = (node.textContent || "").trim();
          if (!text) return null;
          if (!node.id) node.id = slugifyHeading(text, index);
          return { id: node.id, text, level: Number(node.tagName.slice(1)) };
        })
        .filter(Boolean) as ReadingAnchor[];
      setAnchors(next);
    };

    collect();
    const timer = window.setTimeout(collect, 0);

    const onScroll = () => {
      const headings = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"));
      let current = headings[0]?.id || "";
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 84) current = heading.id;
      }
      setActiveAnchorId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToAnchor = useCallback((id: string) => {
    const root = contentRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <ReadingContext.Provider value={{ contentRef, anchors, activeAnchorId, scrollToAnchor }}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReadingContext() {
  return useContext(ReadingContext);
}
