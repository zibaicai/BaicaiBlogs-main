import type { ElementType, ReactNode } from "react";

type TitleProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

export function PageTitle({ children, className = "", as: Tag = "h1" }: TitleProps) {
  return <Tag className={`page-title ${className}`}>{children}</Tag>;
}

export function SectionTitle({ children, className = "", as: Tag = "h2" }: TitleProps) {
  return <Tag className={`section-title ${className}`}>{children}</Tag>;
}

export type ResourceTitleVariant = "card" | "compact" | "overlay" | "featured";

export function ResourceTitle({
  children,
  className = "",
  variant,
  as: Tag = "h2",
}: TitleProps & { variant?: ResourceTitleVariant }) {
  return (
    <Tag className={`resource-title ${variant ? `resource-title--${variant}` : ""} ${className}`}>
      {children}
    </Tag>
  );
}
