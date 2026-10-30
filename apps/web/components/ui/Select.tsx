"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export type SelectSize = "sm" | "md" | "lg";
export type SelectWidth = "auto" | "full" | "compact";
export type SelectTone = "default" | "subtle" | "ghost";
export type SelectMenuWidth = "trigger" | "content" | number;

export interface SelectOptionState {
  selected: boolean;
  active: boolean;
  disabled: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;

  size?: SelectSize;
  width?: SelectWidth;
  tone?: SelectTone;
  menuWidth?: SelectMenuWidth;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  portalContainer?: HTMLElement | null;

  renderValue?: (option?: SelectOption) => ReactNode;
  renderOption?: (option: SelectOption, state: SelectOptionState) => ReactNode;
  empty?: ReactNode;
  footer?: ReactNode;
}

interface MenuRect {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "请选择",
  disabled = false,
  ariaLabel,
  size = "lg",
  width = "full",
  tone = "default",
  menuWidth = "trigger",
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  portalContainer,
  renderValue,
  renderOption,
  empty,
  footer,
}: SelectProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
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

  const setOpenState = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

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
      top: openAbove ? Math.max(margin, bounds.top - Math.min(300, maxHeight) - 6) : bounds.bottom + 6,
      width: bounds.width,
      maxHeight,
    });
  };

  const openMenu = () => {
    if (disabled) return;
    updateRect();
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : enabledIndexes[0]?.index ?? -1);
    setOpenState(true);
  };

  const closeMenu = (restoreFocus = true) => {
    setOpenState(false);
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
      setOpenState(false);
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

  const menuStyle: CSSProperties = {
    position: "fixed",
    left: rect?.left ?? 0,
    top: rect?.top ?? 0,
    maxHeight: rect?.maxHeight ?? 300,
    zIndex: 400,
    ...(menuWidth === "trigger"
      ? { width: rect?.width }
      : menuWidth === "content"
        ? {}
        : { width: menuWidth }),
  };
  const portalTarget = portalContainer ?? (typeof document !== "undefined" ? document.body : null);

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
          } else if (event.key === "Tab" && open) {
            setOpenState(false);
          }
        }}
        className={`ui-select-trigger ui-select-trigger--${size} ui-select-trigger--${width} ui-select-trigger--${tone} ${
          selected ? "" : "is-placeholder"
        } ${triggerClassName} ${className}`}
      >
        <span className="ui-select-value">
          {renderValue ? renderValue(selected) : selected?.label || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`ui-select-chevron shrink-0 ${open ? "is-open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open &&
        rect &&
        portalTarget &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={menuStyle}
            className={`ui-select-menu admin-scrollbar ${menuClassName}`}
          >
            {options.length === 0 ? (
              <div className="ui-select-empty">{empty ?? "暂无可选项"}</div>
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
                    className={`ui-select-option ${isActive ? "is-active" : ""} ${
                      option.disabled ? "is-disabled" : ""
                    }`}
                  >
                    {renderOption ? (
                      renderOption(option, { selected: isSelected, active: isActive, disabled: Boolean(option.disabled) })
                    ) : (
                      <>
                        <span className="min-w-0">
                          <span className="ui-select-option-label">{option.label}</span>
                          {option.description && (
                            <span className="ui-select-option-description">{option.description}</span>
                          )}
                        </span>
                        {isSelected && <Check size={14} className="shrink-0 text-indigo-500" />}
                      </>
                    )}
                  </div>
                );
              })
            )}
            {footer && <div className="ui-select-footer">{footer}</div>}
          </div>,
          portalTarget
        )}
    </>
  );
}
