"use client";

import { useLayoutEffect, useRef } from "react";

type AutoGrowTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
  ariaLabel?: string;
  onSubmit?: () => void;
  className?: string;
};

export default function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  minRows = 1,
  maxRows = 4,
  disabled = false,
  ariaLabel,
  onSubmit,
  className = "",
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    const style = getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight) || 24;
    const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const minHeight = lineHeight * minRows + padding;
    const maxHeight = lineHeight * maxRows + padding;
    const nextHeight = Math.min(Math.max(element.scrollHeight, minHeight), maxHeight);
    element.style.height = `${nextHeight}px`;
    element.style.overflowY = element.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [maxRows, minRows, value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || event.shiftKey) return;
        if (event.nativeEvent.isComposing) return;
        event.preventDefault();
        onSubmit?.();
      }}
      placeholder={placeholder}
      rows={minRows}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      style={{ resize: "none", lineHeight: 1.6, overflowY: "hidden" }}
    />
  );
}
