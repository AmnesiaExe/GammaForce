import { Geist, Geist_Mono } from "next/font/google";

const heading = Geist({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const body = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const label = Geist({
  variable: "--font-label",
  subsets: ["latin"],
  display: "swap",
});

const code = Geist_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

export const fonts = { heading, body, label, code };

export const style = {
  theme: "dark",
  neutral: "slate",
  brand: "blue",
  accent: "cyan",
  solid: "contrast",
  solidStyle: "flat",
  border: "conservative",
  surface: "filled",
  transition: "micro",
  scaling: "100",
} as const;

export const dataStyle = {
  variant: "gradient",
  mode: "categorical",
  height: 32,
  axis: { stroke: "var(--neutral-border-medium)" },
  tick: {
    fill: "var(--neutral-on-background-medium)",
    fontSize: 11,
    line: false,
  },
} as const;

export const effects = {
  mask: { cursor: false, x: 50, y: 0, radius: 100 },
  gradient: { display: false, opacity: 0, x: 50, y: 60, width: 100, height: 50, tilt: 0, colorStart: "brand-background-strong", colorEnd: "page-background" },
  dots: { display: false, opacity: 0, size: "2", color: "neutral-alpha-weak" },
  grid: { display: false, opacity: 0, color: "neutral-alpha-weak", width: "3rem", height: "3rem" },
  lines: { display: false, opacity: 0, color: "neutral-alpha-weak", size: "16", thickness: 1, angle: 45 },
} as const;
