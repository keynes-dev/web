import type { ChartTheme } from "@tanstack/charts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
    symbol?: "line" | "circle" | "star";
  }
>;

export const CHART_TOOLTIP_CLASS = "keynes-chart-tooltip";

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

interface ChartLegendProps {
  config: ChartConfig;
  items?: readonly string[];
  className?: string;
}

export function ChartLegend({
  config,
  items = Object.keys(config),
  className,
}: ChartLegendProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {items.map((key) => {
        const item = config[key];
        if (!item) {
          throw new Error(`Missing chart configuration for ${key}`);
        }

        return (
          <div className="flex items-center gap-1.5" key={key}>
            {item.symbol === "star" ? (
              <span aria-hidden="true" style={{ color: item.color }}>
                ★
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="shrink-0"
                style={{
                  backgroundColor: item.color,
                  width: item.symbol === "line" ? 18 : 8,
                  height: item.symbol === "line" ? 2 : 8,
                  borderRadius: item.symbol === "circle" ? "50%" : 2,
                }}
              />
            )}
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
