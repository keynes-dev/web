import { defineChart } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { dot } from "@tanstack/charts/dot";
import { lineY } from "@tanstack/charts/line";
import { decorative } from "@tanstack/charts/mark/decorative";
import { ruleX } from "@tanstack/charts/rule";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { text } from "@tanstack/charts/text";
import { tooltip } from "@tanstack/charts/tooltip";
import { curveMonotoneX } from "d3-shape";

import {
  CHART_TOOLTIP_CLASS,
  type ChartConfig,
  chartTheme,
} from "@/components/ui/chart";
import { buildFrontierRows, KNEE_T, T_MAX, upperAt } from "@/lib/charts";

import { ChartFrame } from "./ChartFrame";

const chartConfig = {
  upper: {
    label: "More tickets resolved",
    color: "var(--chart-accent)",
    symbol: "line",
  },
  lower: {
    label: "Fewer tickets resolved",
    color: "var(--chart-3)",
    symbol: "line",
  },
  measured: {
    label: "Experiment",
    color: "var(--chart-4)",
    symbol: "circle",
  },
  knee: {
    label: "Recommended limit",
    color: "var(--color-yellow-400)",
    symbol: "star",
  },
  unlimited: {
    label: "No limit",
    color: "var(--chart-denied)",
    symbol: "circle",
  },
} satisfies ChartConfig;

function isLegendItem(key: string): key is keyof typeof chartConfig {
  return key in chartConfig;
}

const frontierData = buildFrontierRows();
const upperData = frontierData.filter(
  (row): row is typeof row & { upper: number } => row.upper != null,
);
const lowerData = frontierData.filter(
  (row): row is typeof row & { lower: number } => row.lower != null,
);
const measuredData = frontierData.filter(
  (row): row is typeof row & { measured: number } => row.measured != null,
);
const kneeData = frontierData.filter(
  (row): row is typeof row & { knee: number } => row.knee != null,
);
const unlimitedData = frontierData.filter(
  (row): row is typeof row & { ungoverned: number } => row.ungoverned != null,
);
const legendItems = ["measured", "knee"] as const;

const definition = defineChart(
  {
    marks: [
      lineY(upperData, {
        id: "upper",
        x: "tokens",
        y: "upper",
        stroke: chartConfig.upper.color,
        strokeWidth: 1.5,
        curve: d3Curve(curveMonotoneX),
      }),
      lineY(lowerData, {
        id: "lower",
        x: "tokens",
        y: "lower",
        stroke: chartConfig.lower.color,
        strokeDasharray: "4 4",
        strokeWidth: 1.5,
        curve: d3Curve(curveMonotoneX),
      }),
      dot(measuredData, {
        id: "measured",
        x: "tokens",
        y: "measured",
        key: "tokens",
        fill: chartConfig.measured.color,
        r: 3.5,
      }),
      text(kneeData, {
        id: "knee",
        x: "tokens",
        y: "knee",
        text: () => "★",
        key: "tokens",
        fill: chartConfig.knee.color,
        fontSize: 15,
        anchor: "middle",
        dy: 1,
      }),
      text(unlimitedData, {
        id: "unlimited",
        x: "tokens",
        y: "ungoverned",
        text: () => "×",
        key: "tokens",
        fill: chartConfig.unlimited.color,
        fontSize: 18,
        fontWeight: 600,
        anchor: "middle",
        dy: 1,
      }),
      ruleX([KNEE_T], {
        id: "recommended-limit",
        stroke: chartConfig.knee.color,
        strokeDasharray: "4 4",
      }),
      decorative(
        text([{ tokens: KNEE_T, resolved: 95, label: "recommended limit" }], {
          id: "recommended-limit-label",
          x: "tokens",
          y: "resolved",
          text: "label",
          fill: "var(--muted-foreground)",
          fontSize: 11,
          anchor: "end",
          dx: -4,
          dy: 12,
        }),
      ),
    ],
    scales: {
      x: {
        scale: scaleLinear().domain([0, T_MAX]),
        axis: {
          line: false,
          ticks: { size: 0, format: (value) => value.toLocaleString() },
          tickLabels: { fontSize: 11 },
          label: "Average tokens per ticket",
        },
      },
      y: {
        scale: scaleLinear().domain([55, 95]),
        grid: true,
        axis: {
          line: false,
          ticks: { size: 0, format: (value) => `${value}%` },
          tickLabels: { fontSize: 11 },
          label: "Tickets resolved",
        },
      },
    },
    margin: { top: 8, right: 8, bottom: 40, left: 44 },
    theme: chartTheme,
  },
  {
    focus: "group-x",
    svgAnimation: false,
    tooltip: {
      use: tooltip,
      className: CHART_TOOLTIP_CLASS,
      anchor: "group-center",
      sort: "focus",
      content: (points) => {
        const point = points[0];
        if (!point) return { rows: [] };
        return {
          title: `${Number(point.xValue).toLocaleString()} tokens`,
          rows: points.flatMap((candidate) => {
            if (!isLegendItem(candidate.markId)) return [];
            const item = chartConfig[candidate.markId];
            return [
              {
                label: item.label,
                value: `${Math.round(Number(candidate.yValue))}% tickets resolved`,
                color: item.color,
              },
            ];
          }),
        };
      },
    },
  },
);

export function FrontierChart({ compact = false }: { compact?: boolean }) {
  return (
    <ChartFrame
      ariaLabel="Token spend and resolved outcome frontier"
      config={chartConfig}
      definition={definition}
      height={compact ? 260 : 300}
      legendItems={legendItems}
      note={
        compact
          ? null
          : `Recommended setting: ${KNEE_T.toLocaleString()} tokens resolves ${Math.round(upperAt(KNEE_T))}% of tickets.`
      }
    />
  );
}
