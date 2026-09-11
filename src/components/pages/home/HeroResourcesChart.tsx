import { defineChart } from "@tanstack/charts";
import { barX } from "@tanstack/charts/bar";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { stack } from "@tanstack/charts/stack";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";

import {
  CHART_TOOLTIP_CLASS,
  type ChartConfig,
  chartTheme,
} from "@/components/ui/chart";
import { heroResourcesData, type HeroResourceRow } from "@/lib/charts";

import {
  BAR_SIZE,
  categoricalChartHeight,
  ChartFrame,
  Y_AXIS_WIDTH,
} from "./ChartFrame";

const chartConfig = {
  used: {
    label: "Used",
    color: "var(--color-orange-800)",
  },
  reserved: {
    label: "Reserved",
    color: "var(--color-yellow-600)",
  },
  available: {
    label: "Available",
    color: "var(--color-cyan-700)",
  },
} satisfies ChartConfig;

const series = ["available", "reserved", "used"] as const;
const BAR_STROKE = "var(--primary)";

function createDefinition(resources: readonly HeroResourceRow[]) {
  const chartData = resources.flatMap((resource) =>
    series.map((key) => ({
      name: resource.name,
      series: key,
      value: resource[key],
    })),
  );
  const barFrames = resources.map((resource) => ({
    name: resource.name,
    value: 10,
  }));

  return defineChart(
    {
      marks: [
        barX(chartData, {
          id: "resource-bars",
          x: "value",
          y: "name",
          z: "series",
          color: "series",
          key: (row) => `${row.name}:${row.series}`,
          layout: stack({ order: series }),
          maxThickness: BAR_SIZE,
          radius: 0,
          stroke: BAR_STROKE,
          strokeWidth: 1,
        }),
        barX(barFrames, {
          id: "resource-bar-frames",
          x: "value",
          y: "name",
          key: (row) => `${row.name}:frame`,
          fill: "transparent",
          fillOpacity: 0,
          maxThickness: BAR_SIZE,
          radius: 0,
          stroke: BAR_STROKE,
          strokeWidth: 1,
        }),
      ],
      scales: {
        x: {
          scale: scaleLinear().domain([0, 10]),
          axis: false,
        },
        y: {
          scale: () => scaleBand<string>().padding(0.35),
          axis: {
            line: false,
            ticks: { size: 0 },
            tickLabels: {
              anchor: "start",
              dx: -Y_AXIS_WIDTH,
              fontSize: 14,
              fontWeight: 500,
              opacity: 1,
            },
          },
        },
      },
      color: {
        domain: series,
        range: series.map((key) => chartConfig[key].color),
      },
      margin: { top: 0, right: 0, bottom: 0, left: Y_AXIS_WIDTH },
      theme: {
        ...chartTheme,
        // Tick labels always use theme.muted; match Ascii body text instead.
        muted: "var(--foreground)",
      },
    },
    {
      focus: "group-y",
      svgAnimation: true,
      tooltip: {
        use: tooltip,
        className: CHART_TOOLTIP_CLASS,
        anchor: "group-center",
        sort: "color-domain",
        content: (points) => ({
          title: points[0]?.datum.name ?? "",
          rows: points.flatMap((point) => {
            if (!("series" in point.datum)) return [];
            const key = point.datum.series;
            return [
              {
                label: chartConfig[key].label,
                value: point.datum.value.toLocaleString(),
                color: point.color,
              },
            ];
          }),
        }),
      },
    },
  );
}

function resourceStateLabel(resources: readonly HeroResourceRow[]): string {
  return `Budget resources: ${resources
    .map(
      (resource) =>
        `${resource.name} ${resource.used} used, ${resource.reserved} reserved, ${resource.available} available`,
    )
    .join("; ")}`;
}

interface HeroResourcesChartProps {
  resources?: readonly HeroResourceRow[];
}

export function HeroResourcesChart({
  resources = heroResourcesData,
}: HeroResourcesChartProps) {
  const definition = useMemo(() => createDefinition(resources), [resources]);

  return (
    <ChartFrame
      ariaLabel={resourceStateLabel(resources)}
      chartClassName="font-mono text-sm font-medium"
      config={chartConfig}
      definition={definition}
      height={categoricalChartHeight(resources.length)}
      legendClassName="justify-end pt-0 font-mono text-sm font-medium"
      legendItems={series}
    />
  );
}
