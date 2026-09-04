import type { HTMLAttributes, ReactNode } from "react";

// Visual-only "select" pill used across filter rows in the wireframes
// (Status ▾, Date range ▾, etc). Not backed by a real <select> since none of
// these filters are wired up yet — this is a static scaffold.
export default function FilterPill({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center h-9 px-3 rounded-md border border-border bg-surface text-xs text-muted gap-1 ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
