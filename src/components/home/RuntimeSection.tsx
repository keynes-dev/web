import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import type { RuntimeCodeHtml } from "@/lib/runtime-code";
import { RuntimeDemo, runtimeTabs, type RuntimeTab } from "./RuntimeDemo";

const tickerCopy: Record<RuntimeTab, { title: string; description: string }> = {
  Runtime: {
    title: "Define resource budgets",
    description:
      "See shared resources flow from the GTM budget into Growth Operations and Sales Development, with approvals and denials visible at each branch.",
  },
  Budgets: {
    title: "Give every team a clear allocation.",
    description:
      "Create the GTM budget once, then allocate data credits, AI tokens, and email sends to the teams that use them.",
  },
  Policies: {
    title: "Turn business context into limits.",
    description:
      "Evaluate each request against live availability and lead intent, returning an explicit limit, decision, and reason.",
  },
  Workflow: {
    title: "Give every denial a backup plan.",
    description:
      "Request resources before doing work, follow the approved path, and switch to a cheaper plan or retry when Keynes returns a denial reason.",
  },
};

export function RuntimeSection({ code }: { code: RuntimeCodeHtml }) {
  const [selected, setSelected] = useState<RuntimeTab>("Runtime");
  const copy = tickerCopy[selected];
  const selectedIndex = runtimeTabs.indexOf(selected);

  function moveSelection(offset: -1 | 1) {
    const next = runtimeTabs[selectedIndex + offset];
    if (next) setSelected(next);
  }

  return (
    <Section
      id='runtime-demo'
      aria-label='Keynes runtime demonstration'
      className='bg-sky-200'
    >
      <SectionFrame>
        <SectionColumn>
          <SectionContent>
            <article className='grid items-center gap-8 lg:grid-cols-2'>
              <header className='space-y-4'>
                <h2>{copy.title}</h2>
                <p className='max-w-md text-base leading-relaxed text-muted-foreground'>
                  {copy.description}
                </p>
                <div className='flex gap-2 pt-2'>
                  <button
                    type='button'
                    className='inline-flex size-10 items-center justify-center border border-foreground/20 transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-30'
                    aria-label='Previous demo'
                    disabled={selectedIndex === 0}
                    onClick={() => moveSelection(-1)}
                  >
                    <ArrowLeft className='size-4' aria-hidden='true' />
                  </button>
                  <button
                    type='button'
                    className='inline-flex size-10 items-center justify-center border border-foreground/20 transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-30'
                    aria-label='Next demo'
                    disabled={selectedIndex === runtimeTabs.length - 1}
                    onClick={() => moveSelection(1)}
                  >
                    <ArrowRight className='size-4' aria-hidden='true' />
                  </button>
                </div>
              </header>
              <div className='min-w-0'>
                <RuntimeDemo
                  code={code}
                  selected={selected}
                  onSelectedChange={setSelected}
                />
              </div>
            </article>
          </SectionContent>
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
