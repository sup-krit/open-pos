import { Newsreader, Work_Sans } from "next/font/google";

// Display font — headings/page titles + sidebar brand mark only.
export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
  variable: "--font-newsreader",
  display: "swap",
});

// Body/UI/table font — everything else. Thai copy in this app relies on the
// system font fallback (Work Sans has no Thai glyph coverage), matching the
// reference wireframes.
export const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});
