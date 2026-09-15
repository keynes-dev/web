import { ChartSpline, PiggyBank, Scale } from "lucide-react";

import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import { cn } from "@/lib/utils";

const concepts = [
  {
    title: "Budgets",
    caption: "Define resource limits for teams and agents.",
    icon: PiggyBank,
  },
  {
    title: "Policies",
    caption: "Enforce resource limits with business logic.",
    icon: Scale,
  },
  {
    title: "Experiments",
    caption: "Find the optimal resource allocation per workflow.",
    icon: ChartSpline,
  },
] as const;

export function Concepts() {
  return (
    <Section aria-label='Budgets, policies, and experiments'>
      <SectionFrame>
        <SectionColumn>
          <div className='grid lg:grid-cols-3'>
            {concepts.map((concept) => {
              const Icon = concept.icon;
              return (
                <article
                  className={cn(
                    "relative",
                    "not-last:border-b lg:not-last:border-b-0 lg:not-last:border-r",
                  )}
                  key={concept.title}
                >
                  <SectionContent className='flex h-full flex-col gap-4'>
                    <header className='space-y-2'>
                      <span className='flex items-center gap-3'>
                        <Icon className='size-4' strokeWidth={1.5} />
                        <h3>{concept.title}</h3>
                      </span>
                      <p className='max-w-sm text-sm text-muted-foreground'>
                        {concept.caption}
                      </p>
                    </header>
                  </SectionContent>
                </article>
              );
            })}
          </div>
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
