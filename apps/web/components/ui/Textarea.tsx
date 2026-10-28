"use client";

import type { TextareaHTMLAttributes } from "react";

const BASE = "control-field control-textarea";

export default function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${BASE} ${className}`.trim()} />;
}
