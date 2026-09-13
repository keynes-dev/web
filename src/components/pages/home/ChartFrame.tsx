import type { ChartValue, DomChartDefinition } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { ChartLegend, type ChartConfig } from "@/components/ui/chart";

export function ChartFrame<
  TDatum,
  TXValue extends ChartValue,
  TYValue extends ChartValue,
>({
  ariaLabel,
  config,
  definition,
  height,
  legendItems,
}: {
  ariaLabel: string;
  config: ChartConfig;
  definition: DomChartDefinition<TDatum, TXValue, TYValue>;
  height: number;
  legendItems: readonly string[];
}) {
  return (
    <div className="w-full font-mono text-xs" data-slot="chart">
      <Chart
        ariaLabel={ariaLabel}
        className="w-full"
        definition={definition}
        height={height}
        initialWidth={320}
      />
      <ChartLegend
        className="flex-wrap gap-x-4 gap-y-1 pt-2"
        config={config}
        items={legendItems}
      />
    </div>
  );
}
