"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

interface MenuRect {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "请选择",
  disabled = false,
  className = "",
  ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [rect, setRect] = useState<MenuRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const baseId = useId().replace(/:/g, "");
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const listId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const enabledIndexes = useMemo(
    () => options.map((option, index) => ({ option, index })).filter((item) => !item.option.disabled),
    [options]
  );

  const updateRect = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const bounds = trigger.getBoundingClientRect();
    const margin = 8;
    const below = window.innerHeight - bounds.bottom - margin;
    const above = bounds.top - margin;
    const openAbove = below < 180 && above > below;
    const maxHeight = Math.max(120, Math.min(300, openAbove ? above : below));
    setRect({
      left: Math.max(margin, Math.min(bounds.left, window.innerWidth - bounds.width - margin)),
      // Anchor the menu by its bottom edge when it opens upward. Using a
      // guessed 300px height here left short menus floating far above the
      // trigger.
      top: openAbove ? undefined : bounds.bottom + 6,
      bottom: openAbove ? Math.max(margin, window.innerHeight - bounds.top + 6) : undefined,
      width: bounds.width,
      maxHeight,
    });
  };

  const openMenu = () => {
    if (disabled) return;
    updateRect();
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : enabledIndexes[0]?.index ?? -1);
    setOpen(true);
  };

  const closeMenu = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    closeMenu();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onWindowChange = () => updateRect();
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [open]);

  const moveActive = (direction: 1 | -1) => {
    if (!enabledIndexes.length) return;
    const currentPosition = enabledIndexes.findIndex((item) => item.index === activeIndex);
    const nextPosition =
      currentPosition < 0
        ? direction > 0
          ? 0
          : enabledIndexes.length - 1
        : (currentPosition + direction + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPosition].index);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              openMenu();
              return;
            }
            moveActive(event.key === "ArrowDown" ? 1 : -1);
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) openMenu();
            else if (activeIndex >= 0) choose(activeIndex);
          } else if (event.key === "Escape") {
            if (open) {
              event.preventDefault();
              closeMenu();
            }
          } else if (event.key === "Tab") {
            if (open) setOpen(false);
          }
        }}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 text-left text-sm outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-45 ${
          selected ? "text-slate-100" : "text-slate-500"
        } ${className}`}
      >
        <span className="min-w-0 truncate">{selected?.label || placeholder}</span>
        <ChevronDown size={15} className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              left: rect.left,
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
              maxHeight: rect.maxHeight,
              zIndex: 400,
            }}
            className="admin-scrollbar overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-2xl"
          >
            {options.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500">暂无可选项</div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <div
                    key={option.value || `empty-${index}`}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                    onClick={() => choose(index)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      option.disabled
                        ? "cursor-not-allowed text-slate-600"
                        : isActive
                          ? "bg-indigo-500/15 text-white"
                          : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold">{option.label}</span>
                      {option.description && <span className="mt-0.5 block truncate text-[10px] text-slate-500">{option.description}</span>}
                    </span>
                    {isSelected && <Check size={14} className="shrink-0 text-indigo-400" />}
                  </div>
                );
              })
            )}
          </div>,
          document.body
        )}
    </>
  );
}
