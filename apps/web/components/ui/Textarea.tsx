"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import type { ControlSize, ControlTone } from "./Input";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: ControlSize;
  tone?: ControlTone;
  invalid?: boolean;
  fullWidth?: boolean;
  resize?: "vertical" | "none";
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    size = "md",
    tone = "default",
    invalid = false,
    fullWidth = true,
    resize = "vertical",
    className = "",
    ...props
  },
  ref
) {
  return (
    <textarea
      {...props}
      ref={ref}
      aria-invalid={invalid || props["aria-invalid"]}
      className={[
        "control-field",
        "control-textarea",
        size === "sm" ? "control-textarea--sm" : size === "lg" ? "control-textarea--lg" : "",
        tone === "ghost" ? "control-field--ghost" : "",
        invalid ? "control-field--invalid" : "",
        fullWidth ? "" : "control-field--auto",
        resize === "none" ? "control-textarea--no-resize" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
});

Textarea.displayName = "Textarea";

export default Textarea;
