import type { ReactNode } from "react";
import Sidebar from "@/components/shell/Sidebar";

export default function BackOfficeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
