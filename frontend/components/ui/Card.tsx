import type { HTMLAttributes } from "react";

// Deliberately unopinionated about padding/flex/gap: Tailwind's generated
// CSS order (not the order classes appear in a className string) decides
// which same-property utility wins, so mixing a baked-in default (e.g.
// `p-5`) with a per-usage override (e.g. `p-0`) is unreliable. Every call
// site passes its own complete layout classes instead.
export default function Card({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-surface border border-border rounded-md ${className}`} {...rest}>
      {children}
    </div>
  );
}
