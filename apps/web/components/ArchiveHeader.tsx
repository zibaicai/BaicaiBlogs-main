import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { PageTitle } from "./ui/Typography";

export default function ArchiveHeader({
  eyebrow,
  title,
  subtitle,
  count,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  count?: string | number;
  children?: ReactNode;
}) {
  return (
    <header className="directory-header">
      <p className="directory-eyebrow">{eyebrow}</p>
      <PageTitle className="directory-title">{title}</PageTitle>
      <div className="directory-subtitle">
        <Sparkles size={15} className="text-indigo-500" />
        {subtitle && <span>{subtitle}</span>}
        {count !== undefined && <span className="directory-count">{count}</span>}
      </div>
      {children}
    </header>
  );
}
