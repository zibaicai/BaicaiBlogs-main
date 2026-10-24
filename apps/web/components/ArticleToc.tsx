"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type Heading = {
  id: string;
  text: string;
  level: number;
};

type Group = {
  key: string;
  heading?: Heading;
  items: Heading[];
};

function slugifyHeading(text: string, index: number) {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `heading-${base || "section"}-${index}`;
}

export default function ArticleToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".article-prose");
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"));
    const next = nodes
      .map((node, index) => {
        const text = (node.textContent || "").trim();
        if (!text) return null;
        if (!node.id) node.id = slugifyHeading(text, index);
        return { id: node.id, text, level: Number(node.tagName.slice(1)) };
      })
      .filter(Boolean) as Heading[];

    setHeadings(next);

    const onScroll = () => {
      let current = next[0]?.id || "";
      for (const heading of next) {
        const element = document.getElementById(heading.id);
        if (element && element.getBoundingClientRect().top <= 110) {
          current = heading.id;
        }
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const groups = useMemo(() => {
    const result: Group[] = [];
    let current: Group | null = null;
    headings.forEach((heading) => {
      if (heading.level === 1) {
        current = { key: heading.id, heading, items: [] };
        result.push(current);
      } else if (!current) {
        current = { key: "intro", heading: undefined, items: [] };
        result.push(current);
        current.items.push(heading);
      } else {
        current.items.push(heading);
      }
    });
    return result;
  }, [headings]);

  useEffect(() => {
    if (!activeId) return;
    const containing = groups.find(
      (group) => group.heading?.id === activeId || group.items.some((item) => item.id === activeId)
    );
    if (containing) {
      setCollapsed((value) => ({ ...value, [containing.key]: false }));
    }
  }, [activeId, groups]);

  if (headings.length === 0) return null;

  const jump = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 74;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="article-toc">
      <div className="article-toc-heading">目录</div>
      <div className="article-toc-list">
        {groups.map((group) => {
          const isCollapsed = collapsed[group.key] === true;
          return (
            <div key={group.key} className="article-toc-group">
              {group.heading && (
                <button
                  type="button"
                  className={`article-toc-group-title ${activeId === group.heading.id ? "is-active" : ""}`}
                  onClick={() => setCollapsed((value) => ({ ...value, [group.key]: !isCollapsed }))}
                  aria-expanded={!isCollapsed}
                >
                  <span>{group.heading.text}</span>
                  <ChevronDown size={13} className={isCollapsed ? "is-collapsed" : ""} />
                </button>
              )}
              {!isCollapsed && (
                <div className="article-toc-items">
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(event) => jump(event, item.id)}
                      className={`article-toc-item level-${item.level} ${activeId === item.id ? "is-active" : ""}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
