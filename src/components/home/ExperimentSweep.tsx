import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { FrontierChart } from "./FrontierChart";
import {
  experimentRuns,
  productionExample,
  searchLimits,
  tokenLimits,
} from "./experiment-data";

export function ExperimentSweep() {
  return (
    <Card className='mx-auto w-full max-w-sm'>
      <CardHeader>
        <CardTitle>Experiments</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='border-b-2 px-2 py-4 sm:px-5'>
          <p className='mb-1 text-right text-xs text-muted-foreground'>
            Token limit per ticket
          </p>
          <table
            className='w-full table-fixed border-separate border-spacing-1 font-mono text-xs'
            aria-label='Percentage of tickets resolved by token and search limits'
          >
            <thead>
              <tr>
                <th className='w-24 text-left text-xs font-normal text-muted-foreground'>
                  Search limit
                </th>
                {tokenLimits.map((limit) => (
                  <th
                    className='text-xs font-normal text-muted-foreground'
                    key={limit}
                  >
                    {limit.toLocaleString()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {searchLimits.map((searches) => (
                <tr key={searches}>
                  <th
                    className='text-left text-xs font-normal text-muted-foreground'
                    scope='row'
                  >
                    {searches}
                  </th>
                  {tokenLimits.map((limit) => {
                    const run = experimentRuns.find(
                      (candidate) =>
                        candidate.limit === limit &&
                        candidate.searches === searches,
                    );
                    if (!run) return null;

                    return (
                      <td
                        className={cn(
                          "border border-sky-700/40 py-1.5 text-center",
                          run === productionExample &&
                            "border-amber-700 text-amber-700",
                        )}
                        key={limit}
                        style={{
                          backgroundColor: `color-mix(in oklab, var(--chart-accent) ${15 + (run.resolved - 55)}%, transparent)`,
                        }}
                      >
                        {run === productionExample ?
                          <span aria-label='Example production setting'>
                            ★{" "}
                          </span>
                        : null}
                        {run.resolved}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='px-2 py-3 sm:px-4'>
          <FrontierChart />
        </div>
      </CardContent>
    </Card>
  );
}
