"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export type ControlSize = "sm" | "md" | "lg";
export type ControlTone = "default" | "ghost";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: ControlSize;
  tone?: ControlTone;
  invalid?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    tone = "default",
    invalid = false,
    fullWidth = true,
    className = "",
    ...props
  },
  ref
) {
  return (
    <input
      {...props}
      ref={ref}
      aria-invalid={invalid || props["aria-invalid"]}
      className={[
        "control-field",
        `control-field--${size}`,
        tone === "ghost" ? "control-field--ghost" : "",
        invalid ? "control-field--invalid" : "",
        fullWidth ? "" : "control-field--auto",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
});

Input.displayName = "Input";

export default Input;
