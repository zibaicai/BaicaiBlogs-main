"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import StickyPanel from "../ui/StickyPanel";
import { glassProps } from "../ui/glass/GlassSurface";
import { useReadingContext, type ReadingAnchor } from "./ReadingContext";

type Group = {
  key: string;
  heading?: ReadingAnchor;
  items: ReadingAnchor[];
};

export default function TableOfContents({
  title = "目录",
  className = "",
}: {
  title?: string;
  className?: string;
}) {
  const reading = useReadingContext();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const result: Group[] = [];
    let current: Group | null = null;
    (reading?.anchors || []).forEach((heading) => {
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
  }, [reading?.anchors]);

  const activeId = reading?.activeAnchorId || "";

  useEffect(() => {
    if (!activeId) return;
    const containing = groups.find(
      (group) => group.heading?.id === activeId || group.items.some((item) => item.id === activeId)
    );
    if (containing) {
      setCollapsed((value) => ({ ...value, [containing.key]: false }));
    }
  }, [activeId, groups]);

  if (!reading || reading.anchors.length === 0) return null;

  return (
    <StickyPanel
      {...glassProps("card", "suspend", `article-toc ${className}`.trim())}
      header={<div className="article-toc-heading">{title}</div>}
      bodyClassName="article-toc-list"
      scroll
    >
      {groups.map((group) => {
        const isCollapsed = collapsed[group.key] === true;
        return (
          <div key={group.key} className="article-toc-group">
            {group.heading && (
              <button
                type="button"
                className={`article-toc-group-title text-toc ${activeId === group.heading.id ? "is-active" : ""}`}
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
                    onClick={(event) => {
                      event.preventDefault();
                      reading.scrollToAnchor(item.id);
                    }}
                    className={`article-toc-item text-toc level-${item.level} ${activeId === item.id ? "is-active" : ""}`}
                  >
                    {item.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </StickyPanel>
  );
}
