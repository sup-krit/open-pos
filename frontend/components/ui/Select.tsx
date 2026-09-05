import type { ButtonHTMLAttributes, ReactNode } from "react";

// Visual "select" pill used across filter rows in the wireframes
// (Status ▾, Date range ▾, etc). Renders as a button so it can optionally act
// as a toggle: pass `active` + `onClick` to wire up real filtering, or omit
// them to keep the old static/visual-only usage.
export default function FilterPill({
  children,
  className = "",
  active = false,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center h-9 px-3 rounded-md border text-xs gap-1 ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface text-muted"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
