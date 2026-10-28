"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export default function BackButton({
  fallbackHref = "/posts",
  label = "返回上一级",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="group mb-6 inline-flex w-max items-center gap-2 rounded-full border border-slate-200/80 bg-white/55 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm outline-none backdrop-blur-sm transition-colors hover:border-[var(--ui-accent)]/40 hover:text-[var(--ui-accent)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
    >
      <ArrowLeft
        size={16}
        strokeWidth={2}
        className="transition-transform duration-300 group-hover:-translate-x-0.5"
      />
      {label}
    </button>
  );
}
