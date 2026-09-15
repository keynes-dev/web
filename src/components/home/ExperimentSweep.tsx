import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { FrontierChart, FrontierChartLegend } from "./FrontierChart";
import { dataCreditLimits, tokenLimits } from "./experiment-data";

export function ExperimentSweep() {
  return (
    <Card className='mx-auto w-full max-w-sm'>
      <CardHeader>
        <CardTitle>Experiments</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='space-y-4 border-b-2 p-3'>
          <dl className='space-y-3'>
            <div className='space-y-1.5'>
              <dt className='text-xs text-muted-foreground'>
                AI tokens per lead
              </dt>
              <dd className='flex items-center gap-2 font-mono text-xs'>
                <span
                  aria-hidden='true'
                  className='text-lg text-muted-foreground'
                >
                  [
                </span>
                <ul className='grid flex-1 grid-cols-4 gap-1'>
                  {tokenLimits.map((limit) => (
                    <li
                      key={limit}
                      className='border border-sky-700/30 bg-sky-100 py-1 text-center text-sky-900'
                    >
                      {limit.toLocaleString()}
                    </li>
                  ))}
                </ul>
                <span
                  aria-hidden='true'
                  className='text-lg text-muted-foreground'
                >
                  ]
                </span>
              </dd>
            </div>
            <div className='space-y-1.5'>
              <dt className='text-xs text-muted-foreground'>
                Data credits per lead
              </dt>
              <dd className='flex items-center gap-2 font-mono text-xs'>
                <span
                  aria-hidden='true'
                  className='text-lg text-muted-foreground'
                >
                  [
                </span>
                <ul className='grid flex-1 grid-cols-3 gap-1'>
                  {dataCreditLimits.map((limit) => (
                    <li
                      key={limit}
                      className='border border-emerald-700/30 bg-emerald-50 py-1 text-center text-emerald-900'
                    >
                      {limit}
                    </li>
                  ))}
                </ul>
                <span
                  aria-hidden='true'
                  className='text-lg text-muted-foreground'
                >
                  ]
                </span>
              </dd>
            </div>
          </dl>
          <p className='flex flex-wrap items-baseline justify-between gap-2 text-xs'>
            <span className='text-muted-foreground'>Total test runs</span>
            <span className='font-mono'>12</span>
          </p>
        </div>
        <div className='p-3'>
          <FrontierChart />
        </div>
      </CardContent>
      <CardFooter>
        <FrontierChartLegend />
      </CardFooter>
    </Card>
  );
}
