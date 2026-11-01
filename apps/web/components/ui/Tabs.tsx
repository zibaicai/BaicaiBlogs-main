"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

export type TabsSize = "sm" | "md";

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
}

export interface TabsProps {
  items: readonly TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel?: string;
  id?: string;
  size?: TabsSize;
  className?: string;
}

/**
 * Accessible segmented tabs.
 * The component owns the tablist; the caller owns the matching tabpanel.
 */
export default function Tabs({
  items,
  value,
  onValueChange,
  ariaLabel = "标签页",
  id = "ui-tabs",
  size = "md",
  className = "",
}: TabsProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (event: KeyboardEvent<HTMLButtonElement>, direction: 1 | -1 | "first" | "last") => {
    const current = buttons.current.findIndex((button) => button === event.currentTarget);
    if (current < 0) return;
    event.preventDefault();
    let next = current;
    if (direction === "first") next = 0;
    else if (direction === "last") next = items.length - 1;
    else next = (current + direction + items.length) % items.length;
    buttons.current[next]?.focus();
    onValueChange(items[next].value);
  };

  return (
    <div
      className={`ui-tabs ui-tabs--${size} ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(element) => { buttons.current[index] = element; }}
            id={`${id}-tab-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${id}-panel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") move(event, 1);
              else if (event.key === "ArrowLeft") move(event, -1);
              else if (event.key === "Home") move(event, "first");
              else if (event.key === "End") move(event, "last");
            }}
            className={`ui-tabs-button ${selected ? "is-selected" : ""}`}
          >
            {item.icon && <span className="ui-tabs-icon">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
