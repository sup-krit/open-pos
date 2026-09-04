import type { ReactNode } from "react";

export default function Topbar({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="h-16 shrink-0 bg-surface border-b border-border flex items-center justify-between px-8">
      <h1 className="font-display italic font-semibold text-xl m-0">{title}</h1>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
