import type { ComponentProps, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

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

export const runtimeTabs = ["Runtime", "Budget", "Policy", "Workflow"] as const;

export type RuntimeTab = (typeof runtimeTabs)[number];

const panelRadius = "rounded-sm rounded-tl-none";

function CodeScrollArea({
  className,
  contentClassName,
  children,
  ...props
}: ComponentProps<"div"> & { contentClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setCanScrollDown(el.scrollHeight - el.clientHeight - el.scrollTop > 1);
    }

    update();
    const frame = requestAnimationFrame(update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    el.addEventListener("scroll", update, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      <div
        ref={ref}
        className={cn("h-full min-h-0 overflow-auto", contentClassName)}
        {...props}
      >
        {children}
      </div>
      <div
        aria-hidden='true'
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent transition-opacity",
          canScrollDown ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function RuntimeCard() {
  return (
    <Card
      className={cn("min-h-0 flex-1 overflow-hidden", panelRadius)}
      aria-label='Runtime view'
    >
      <CardContent
        className='relative min-h-0 flex-1 overflow-hidden p-3'
        id='runtime-panel-runtime'
        role='tabpanel'
        aria-labelledby='runtime-tab-runtime'
        tabIndex={0}
      >
        <div className='absolute inset-x-3 top-1/2 -translate-y-1/2'>
          <BudgetTree />
        </div>
      </CardContent>
      <CardFooter className='p-3'>
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
      className={cn("flex min-h-0 flex-1 flex-col", panelRadius)}
      aria-label='Budgets view'
      id='runtime-panel-budgets'
      role='tabpanel'
      aria-labelledby='runtime-tab-budgets'
      tabIndex={0}
    >
      <CardHeader className='flex flex-row items-center justify-between gap-3 bg-taupe-700 py-2'>
        <CardTitle className='text-xs'>budgets.ts</CardTitle>
        <span className='flex items-center gap-1.5 font-mono text-xs text-background'>
          <Braces className='size-3.5' aria-hidden='true' />
          TypeScript
        </span>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col overflow-hidden p-0'>
        <CodeScrollArea
          contentClassName='runtime-code px-3 py-2'
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
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden border-2 bg-card",
        panelRadius,
      )}
      aria-label='Policies view'
      id='runtime-panel-policies'
      role='tabpanel'
      aria-labelledby='runtime-tab-policies'
      tabIndex={0}
    >
      <div className='flex items-center justify-between gap-3 rounded-t-[calc(var(--radius-sm)-2px)] rounded-tl-none border-b-2 px-3 py-2 font-mono text-xs text-background bg-taupe-700'>
        <div className='flex items-center gap-2'>
          <span
            className='flex size-4 items-center justify-center border border-background text-xs'
            aria-hidden='true'
          >
            <Play className='size-2' />
          </span>
          <span>lead_enrichment_policy.sql</span>
        </div>
        <span
          className='flex items-center gap-1.5 text-background'
          aria-label='Data source: policy views'
        >
          <Database className='size-3.5' aria-hidden='true' />
          Policy
          <ChevronDown className='size-3.5' aria-hidden='true' />
        </span>
      </div>

      <CodeScrollArea>
        <div className='flex min-w-max p-3'>
          <pre
            className='mr-3 border-r pr-3 text-right font-mono text-xs leading-snug text-muted-foreground'
            aria-hidden='true'
          >
            {Array.from({ length: 20 }, (_, index) => index + 1).join("\n")}
          </pre>
          <div
            className='runtime-code pr-3 [&_pre]:break-normal [&_pre]:whitespace-pre'
            aria-label='Policy SQL query'
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </CodeScrollArea>

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
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden border-2 bg-card",
        panelRadius,
      )}
      aria-label='Workflow view'
      id='runtime-panel-workflow'
      role='tabpanel'
      aria-labelledby='runtime-tab-workflow'
      tabIndex={0}
    >
      <div className='flex items-center justify-between gap-3 rounded-t-[calc(var(--radius-sm)-2px)] rounded-tl-none border-b-2 px-3 py-2 font-mono text-xs text-background bg-taupe-700'>
        <span>lead-enrichment.ts</span>
        <span className='flex items-center gap-1.5 text-background'>
          <Braces className='size-3.5' aria-hidden='true' />
          TypeScript
        </span>
      </div>
      <CodeScrollArea contentClassName='p-3'>
        <div
          className='runtime-code min-w-0'
          aria-label='Lead enrichment application workflow'
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CodeScrollArea>
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
      className='mx-auto flex h-132 w-full max-w-sm flex-col'
      aria-label='Keynes runtime example'
    >
      <div
        className='flex w-fit max-w-full overflow-x-auto'
        role='tablist'
        aria-label='Demo views'
      >
        {runtimeTabs.map((tab, index) => {
          const active = tab === selected;
          const id = tab.toLowerCase();
          const isFirst = index === 0;
          const isLast = index === runtimeTabs.length - 1;
          return (
            <button
              className={cn(
                "shrink-0 border-r-2 border-t-2 bg-sky-100 px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isFirst && "rounded-tl-sm border-l-2",
                isLast && "rounded-tr-sm",
                active &&
                  "bg-taupe-700 text-background hover:bg-foreground hover:text-background",
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
      : selected === "Budget" ?
        <BudgetsCard html={code.budgets} />
      : selected === "Policy" ?
        <PoliciesCard html={code.policies} />
      : <WorkflowCard html={code.workflow} />}
    </div>
  );
}
