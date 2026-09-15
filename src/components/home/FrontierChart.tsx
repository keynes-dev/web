import { defineChart } from "@tanstack/charts";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { dot } from "@tanstack/charts/dot";
import { lineY } from "@tanstack/charts/line";
import { ruleX } from "@tanstack/charts/rule";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { text } from "@tanstack/charts/text";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/charts/react";
import { curveMonotoneX } from "d3-shape";

import {
  CHART_CLASS,
  CHART_TOOLTIP_CLASS,
  type ChartConfig,
  chartTheme,
} from "@/lib/chart";
import { cn } from "@/lib/utils";
import { buildFrontierSeries, T_MAX } from "@/lib/charts";
import { experimentRuns, productionExample } from "./experiment-data";

const chartConfig = {
  upper: {
    label: "Best results at each cost",
    color: "var(--chart-accent)",
    symbol: "line",
  },
  lower: {
    label: "Less effective settings",
    color: "var(--chart-3)",
    symbol: "line",
  },
  measured: {
    label: "Test run",
    color: "var(--chart-4)",
    symbol: "circle",
  },
  knee: {
    label: "Optimal config",
    color: "var(--chart-recommended)",
    symbol: "star",
  },
} satisfies ChartConfig;

type LegendEntry = (typeof chartConfig)[keyof typeof chartConfig];

const Y_MIN = 50;
const Y_TICKS = [50, 60, 70, 80, 90, 100];
const AXIS_LABEL_CLASS = "text-[11px] font-semibold text-foreground/75";

/** The two curves are self-evident from the axes, so only the points are named. */
const legendKeys = ["measured", "knee"] as const;

function isLegendItem(key: string): key is keyof typeof chartConfig {
  return key in chartConfig;
}

const { upper, lower } = buildFrontierSeries();
const measuredRuns = experimentRuns.filter((run) => run !== productionExample);
const knee = productionExample;
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
      ruleX([knee.tokens], {
        id: "recommended-limit",
        stroke: chartConfig.knee.color,
        strokeDasharray: "4 4",
      }),
    ],
    scales: {
      x: {
        scale: scaleLinear().domain([0, T_MAX]),
        axis: {
          line: true,
          ticks: {
            count: 4,
            size: 4,
            format: (value) => value.toLocaleString(),
          },
          tickLabels: { fontSize: 11 },
        },
      },
      y: {
        scale: scaleLinear().domain([Y_MIN, 100]),
        grid: true,
        axis: {
          line: true,
          ticks: {
            values: Y_TICKS,
            size: 4,
            format: (value) => `${value}%`,
          },
          tickLabels: { fontSize: 11 },
        },
      },
    },
    // Both axis labels are rendered as HTML by the component, since the scene
    // centers its own labels with no alignment option. Margins stay unset so
    // the scene fits its tick labels; the card cell owns the visible padding.
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
                value: `${Math.round(Number(candidate.yValue))}% leads enriched`,
                color: item.color,
              },
            ];
          }),
        };
      },
    },
  },
);

function LegendSymbol({ symbol, color }: LegendEntry) {
  switch (symbol) {
    case "line":
      return (
        <i
          aria-hidden='true'
          className='h-0.5 w-3 shrink-0'
          style={{ backgroundColor: color }}
        />
      );
    case "circle":
      return (
        <i
          aria-hidden='true'
          className='size-2 shrink-0 rounded-full'
          style={{ backgroundColor: color }}
        />
      );
    case "star":
      return (
        <i
          aria-hidden='true'
          className='shrink-0 text-sm leading-none not-italic'
          style={{ color }}
        >
          ★
        </i>
      );
    default: {
      const exhaustive: never = symbol;
      throw new Error(`Unhandled legend symbol: ${String(exhaustive)}`);
    }
  }
}

export function FrontierChartLegend() {
  return (
    <ul className='flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-xs text-muted-foreground'>
      {legendKeys.map((key) => {
        const entry = chartConfig[key];
        return (
          <li className='flex items-center gap-1.5' key={key}>
            <LegendSymbol {...entry} />
            {entry.label}
          </li>
        );
      })}
    </ul>
  );
}

export function FrontierChart() {
  return (
    <div className='flex gap-1.5 font-mono text-xs'>
      <p
        className={cn(
          AXIS_LABEL_CLASS,
          // Reads bottom-to-top, matching the rotation the scene used.
          "flex items-center justify-end rotate-180 [writing-mode:vertical-rl]",
        )}
      >
        Success rate
      </p>
      <div className='flex min-w-0 flex-1 flex-col'>
        <Chart
          ariaLabel='Compare lead enrichment budgets: AI tokens per lead and percentage of leads enriched'
          className={cn(CHART_CLASS, "w-full")}
          definition={definition}
          height={198}
          // The card is `max-w-sm` less its borders, cell padding, and the y label.
          initialWidth={334}
        />
        <p className={cn(AXIS_LABEL_CLASS, "flex items-center justify-end")}>
          Cost per lead
        </p>
      </div>
    </div>
  );
}
