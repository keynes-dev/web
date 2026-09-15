import { defineChart } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { dot } from "@tanstack/charts/dot";
import { lineY } from "@tanstack/charts/line";
import { decorative } from "@tanstack/charts/mark/decorative";
import { ruleX } from "@tanstack/charts/rule";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { text } from "@tanstack/charts/text";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/charts/react";
import { curveMonotoneX } from "d3-shape";

import { CHART_TOOLTIP_CLASS, type ChartConfig, chartTheme } from "@/lib/chart";
import { buildFrontierSeries, KNEE_T, T_MAX } from "@/lib/charts";

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
    color: "var(--chart-recommended)",
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

const { upper, lower, measuredRuns, knee, ungoverned } = buildFrontierSeries();
const definition = defineChart(
  {
    marks: [
      lineY(upper, {
        id: "upper",
        x: "tokens",
        y: "resolved",
        stroke: chartConfig.upper.color,
        strokeWidth: 1.5,
        curve: d3Curve(curveMonotoneX),
      }),
      lineY(lower, {
        id: "lower",
        x: "tokens",
        y: "resolved",
        stroke: chartConfig.lower.color,
        strokeDasharray: "4 4",
        strokeWidth: 1.5,
        curve: d3Curve(curveMonotoneX),
      }),
      dot(measuredRuns, {
        id: "measured",
        x: "tokens",
        y: "resolved",
        key: "tokens",
        fill: chartConfig.measured.color,
        r: 3.5,
      }),
      text([knee], {
        id: "knee",
        x: "tokens",
        y: "resolved",
        text: () => "★",
        key: "tokens",
        fill: chartConfig.knee.color,
        fontSize: 15,
        anchor: "middle",
        dy: 1,
      }),
      text([ungoverned], {
        id: "unlimited",
        x: "tokens",
        y: "resolved",
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

export function FrontierChart() {
  return (
    <div className="w-full font-mono text-xs">
      <Chart
        ariaLabel="Token spend and resolved outcome frontier"
        className="w-full"
        definition={definition}
        height={236}
        initialWidth={320}
      />
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2">
        <span className="flex items-center gap-1.5">
          <i
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full bg-mauve-700"
          />
          {chartConfig.measured.label}
        </span>
        <span className="flex items-center gap-1.5">
          <i
            aria-hidden="true"
            className="text-amber-700 not-italic"
          >
            ★
          </i>
          {chartConfig.knee.label}
        </span>
      </div>
    </div>
  );
}
