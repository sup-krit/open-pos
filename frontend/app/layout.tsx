import type { Metadata } from "next";
import type { ReactNode } from "react";
import { newsreader, workSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open POS",
  description:
    "Open POS — single-brand retail POS and back-office system (portfolio scaffold).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={`${newsreader.variable} ${workSans.variable}`}>
      <body className="font-body antialiased bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
