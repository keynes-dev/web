import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import { ExperimentSweep } from "./ExperimentSweep";

export function ExperimentSection() {
  return (
    <Section id='how-experiments' aria-label='Experiments'>
      <SectionFrame>
        <SectionColumn>
          <SectionContent>
            <article className='grid min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-16'>
              <header className='flex flex-col gap-4'>
                <h2>Find the right budget.</h2>
                <div className='max-w-3xl text-base leading-relaxed text-muted-foreground'>
                  <p className='max-w-md text-foreground'>
                    Run the same support tickets with different token budgets
                    and search limits. Compare how many tickets get resolved to
                    see where extra spending helps.
                  </p>
                </div>
              </header>
              <div>
                <ExperimentSweep />
              </div>
            </article>
          </SectionContent>
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
