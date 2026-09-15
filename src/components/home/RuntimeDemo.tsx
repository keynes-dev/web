import type { KeyboardEvent } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RuntimeCodeHtml } from "@/lib/runtime-code";
import { cn } from "@/lib/utils";
import { BudgetTree } from "./BudgetTree";
import { ResourceSwatch } from "./ResourceBar";
import { Braces, ChevronDown, Database, Play } from "lucide-react";

export const runtimeTabs = [
  "Runtime",
  "Budgets",
  "Policies",
  "Workflow",
] as const;

export type RuntimeTab = (typeof runtimeTabs)[number];

function RuntimeCard() {
  return (
    <Card
      className='min-h-0 flex-1 overflow-hidden bg-transparent border-none'
      aria-label='Runtime view'
    >
      <CardContent
        className='min-h-0 flex-1 overflow-hidden p-0 border-2 bg-card'
        id='runtime-panel-runtime'
        role='tabpanel'
        aria-labelledby='runtime-tab-runtime'
        tabIndex={0}
      >
        <div className='h-full overflow-auto p-3'>
          <BudgetTree />
        </div>
      </CardContent>
      <CardFooter className='border-2 border-t-0 bg-card p-3'>
        <div className='flex w-full flex-wrap items-center justify-end gap-4 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1.5'>
            <ResourceSwatch kind='available' />
            Available
          </span>
          <span className='flex items-center gap-1.5'>
            <ResourceSwatch kind='reserved' />
            Reserved
          </span>
          <span className='flex items-center gap-1.5'>
            <ResourceSwatch kind='used' />
            Used
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

function BudgetsCard({ html }: { html: string }) {
  return (
    <Card
      className='min-h-0 flex-1 overflow-hidden'
      aria-label='Budgets view'
      id='runtime-panel-budgets'
      role='tabpanel'
      aria-labelledby='runtime-tab-budgets'
      tabIndex={0}
    >
      <CardHeader className='flex flex-row items-center justify-between gap-3 py-2 bg-taupe-700'>
        <CardTitle className='text-xs'>budgets.ts</CardTitle>
        <span className='flex items-center gap-1.5 font-mono text-xs text-background'>
          <Braces className='size-3.5' aria-hidden='true' />
          TypeScript
        </span>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col overflow-hidden p-0'>
        <div
          className='runtime-code min-h-0 flex-1 overflow-auto px-3 py-2'
          aria-label='Budget definition code'
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CardContent>
    </Card>
  );
}

function PoliciesCard({ html }: { html: string }) {
  return (
    <div
      className='flex min-h-0 flex-1 flex-col overflow-hidden border-2 bg-card'
      aria-label='Policies view'
      id='runtime-panel-policies'
      role='tabpanel'
      aria-labelledby='runtime-tab-policies'
      tabIndex={0}
    >
      <div className='flex items-center justify-between gap-3 border-b-2 px-3 py-2 font-mono text-xs text-background bg-taupe-700'>
        <div className='flex items-center gap-2'>
          <span
            className='flex size-4 items-center justify-center border border-background text-xs'
            aria-hidden='true'
          >
            <Play className='size-2' />
          </span>
          <span>lead_enrichment_limit.sql</span>
        </div>
        <span
          className='flex items-center gap-1.5 text-background'
          aria-label='Data source: policy views'
        >
          <Database className='size-3.5' aria-hidden='true' />
          <span className='hidden sm:inline'>Policy views</span>
          <span className='sm:hidden'>Views</span>
          <ChevronDown className='size-3.5' aria-hidden='true' />
        </span>
      </div>

      <div className='min-h-0 flex-1 overflow-auto'>
        <div className='flex min-w-max p-3'>
          <pre
            className='mr-3 border-r pr-3 text-right font-mono text-xs leading-snug text-muted-foreground'
            aria-hidden='true'
          >
            {Array.from({ length: 17 }, (_, index) => index + 1).join("\n")}
          </pre>
          <div
            className='runtime-code pr-3 [&_pre]:break-normal [&_pre]:whitespace-pre'
            aria-label='Policy SQL query'
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      <p className='border-t-2 border-b-1 px-3 py-2 font-mono text-xs text-muted-foreground'>
        1 row returned
      </p>
      <div className='overflow-auto'>
        <table className='w-full border-collapse font-mono text-xs'>
          <tbody>
            <tr className='border-t'>
              <th className='w-1/3 border-r px-3 py-2 text-left font-normal text-muted-foreground'>
                decision
              </th>
              <td className='px-3 py-2 font-medium text-emerald-500'>
                Approved
              </td>
            </tr>
            <tr className='border-t'>
              <th className='border-r px-3 py-2 text-left font-normal text-muted-foreground'>
                intent score
              </th>
              <td className='px-3 py-2'>84</td>
            </tr>
            <tr className='border-t'>
              <th className='border-r px-3 py-2 text-left font-normal text-muted-foreground'>
                resources
              </th>
              <td className='px-3 py-2'>6 data credits</td>
            </tr>
            <tr className='border-t'>
              <th className='border-r px-3 py-2 text-left font-normal text-muted-foreground'>
                reason
              </th>
              <td className='px-3 py-2'>within_intent_limit</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkflowCard({ html }: { html: string }) {
  return (
    <div
      className='flex min-h-0 flex-1 flex-col overflow-hidden border-2 bg-card'
      aria-label='Workflow view'
      id='runtime-panel-workflow'
      role='tabpanel'
      aria-labelledby='runtime-tab-workflow'
      tabIndex={0}
    >
      <div className='flex items-center justify-between gap-3 border-b-2 px-3 py-2 font-mono text-xs text-background bg-taupe-700'>
        <span>lead-enrichment.ts</span>
        <span className='flex items-center gap-1.5 text-background'>
          <Braces className='size-3.5' aria-hidden='true' />
          TypeScript
        </span>
      </div>
      <div className='min-h-0 flex-1 overflow-auto'>
        <div
          className='runtime-code min-w-0 p-3'
          aria-label='Lead enrichment application workflow'
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

export function RuntimeDemo({
  code,
  selected,
  onSelectedChange,
}: {
  code: RuntimeCodeHtml;
  selected: RuntimeTab;
  onSelectedChange: (tab: RuntimeTab) => void;
}) {
  function selectFromKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const current = runtimeTabs.indexOf(selected);
    const next =
      event.key === "Home" ? 0
      : event.key === "End" ? runtimeTabs.length - 1
      : (current + (event.key === "ArrowRight" ? 1 : -1) + runtimeTabs.length) %
        runtimeTabs.length;
    const nextTab = runtimeTabs[next];
    onSelectedChange(nextTab);
    document.getElementById(`runtime-tab-${nextTab.toLowerCase()}`)?.focus();
  }

  return (
    <div
      className='mx-auto flex h-136 w-full max-w-sm flex-col'
      aria-label='Keynes runtime example'
    >
      <div
        className='flex overflow-x-auto'
        role='tablist'
        aria-label='Demo views'
      >
        {runtimeTabs.map((tab, index) => {
          const active = tab === selected;
          const id = tab.toLowerCase();
          return (
            <button
              className={cn(
                "shrink-0 border-r-2 border-t-2 bg-sky-100 px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                index === 0 && "border-l-2",
                active &&
                  "bg-taupe-700 text-background underline hover:bg-foreground hover:text-background",
              )}
              id={`runtime-tab-${id}`}
              key={tab}
              role='tab'
              type='button'
              aria-controls={`runtime-panel-${id}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelectedChange(tab)}
              onKeyDown={selectFromKeyboard}
            >
              {tab}
            </button>
          );
        })}
      </div>
      {selected === "Runtime" ?
        <RuntimeCard />
      : selected === "Budgets" ?
        <BudgetsCard html={code.budgets} />
      : selected === "Policies" ?
        <PoliciesCard html={code.policies} />
      : <WorkflowCard html={code.workflow} />}
    </div>
  );
}
