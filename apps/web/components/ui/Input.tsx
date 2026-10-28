"use client";

import type { InputHTMLAttributes } from "react";

const BASE = "control-field";

export default function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${BASE} ${className}`.trim()} />;
}
