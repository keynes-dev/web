import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "./experiment-sweep.css";

import { FrontierChart } from "./FrontierChart";
import {
  experimentRuns,
  productionExample,
  searchLimits,
  tokenLimits,
} from "./experiment-data";

export function ExperimentSweep() {
  return (
    <Card className="how-it-works__floating-card experiment-sweep">
      <CardHeader className="border-b">
        <CardTitle>Support ticket experiments</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="experiment-sweep__array">
          <p>Token limit per ticket</p>
          <table aria-label="Percentage of tickets resolved by token and search limits">
            <thead>
              <tr>
                <th>Search limit</th>
                {tokenLimits.map((limit) => (
                  <th key={limit}>{limit.toLocaleString()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {searchLimits.map((searches) => (
                <tr key={searches}>
                  <th scope="row">{searches}</th>
                  {tokenLimits.map((limit) => {
                    const run = experimentRuns.find(
                      (candidate) =>
                        candidate.limit === limit && candidate.searches === searches,
                    );
                    if (!run) return null;

                    return (
                      <td
                        key={limit}
                        data-selected={run === productionExample}
                        style={{
                          backgroundColor: `color-mix(in oklab, var(--chart-accent) ${15 + (run.resolved - 55)}%, transparent)`,
                        }}
                      >
                        {run === productionExample ? (
                          <span aria-label="Example production setting">★ </span>
                        ) : null}
                        {run.resolved}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="experiment-sweep__count">
            12 configurations. Each cell shows tickets resolved out of the same 100.
          </p>
        </div>
        <div className="experiment-sweep__chart">
          <FrontierChart compact />
        </div>
      </CardContent>
    </Card>
  );
}
