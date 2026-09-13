import type { ChartTheme } from "@tanstack/charts";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
    symbol?: "line" | "circle" | "star";
  }
>;

export const chartTheme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
  background: "transparent",
  palette: [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ],
} satisfies ChartTheme;

export const CHART_TOOLTIP_CLASS = "keynes-chart-tooltip";
