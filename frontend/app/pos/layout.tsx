import type { ReactNode } from "react";

// Mobile-first POS shell — no sidebar/topbar chrome. Centered on wider
// viewports, full-bleed below the max width so it reads correctly on an
// actual phone screen.
export default function PosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex justify-center bg-paper">
      <div className="w-full max-w-[430px] flex flex-col min-h-screen bg-paper">
        {children}
      </div>
    </div>
  );
}
