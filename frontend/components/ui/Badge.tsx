import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "ink" | "ink-strong";

const tones: Record<Tone, string> = {
  neutral: "border-muted text-muted",
  accent: "border-accent text-accent",
  ink: "border-ink text-ink",
  "ink-strong": "border-ink text-ink font-medium",
};

export default function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center h-5 px-2 rounded border text-[11px] whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
