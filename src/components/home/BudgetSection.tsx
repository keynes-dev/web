import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import { BudgetTree } from "./BudgetTree";

export function BudgetSection() {
  return (
    <Section id='how-budgets' aria-label='Budgets' className='bg-sky-200'>
      <SectionFrame>
        <SectionColumn>
          <SectionContent>
            <article className='grid min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-16'>
              <header className='relative space-y-4'>
                <p className='font-mono text-xs leading-normal tracking-wider uppercase text-muted-foreground'>
                  01 / Budgets
                </p>
                <h2>Give every agent a budget.</h2>
                <div className='max-w-3xl text-base leading-relaxed text-muted-foreground'>
                  <p className='max-w-md text-foreground'>
                    A furniture retailer uses agents to create product listings
                    and help customers with deliveries. Give each team the
                    tokens, image generations, API calls, and messages its work
                    needs.
                  </p>
                  <p className='mt-6 max-w-md'>
                    Give each workflow the resources it needs, within its team’s
                    limits.
                  </p>
                </div>
              </header>
              <div className='min-w-0 py-5'>
                <BudgetTree />
              </div>
            </article>
          </SectionContent>
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
