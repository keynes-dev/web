import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";

export function Technology() {
  return (
    <Section aria-label='Technology'>
      <SectionFrame>
        <SectionColumn className='overflow-hidden'>
          <SectionContent>
            <article className='relative z-10 flex flex-col gap-4 lg:flex-row lg:gap-16'>
              <h2 className='shrink-0'>It's just PostgreSQL</h2>
              <div className='space-y-4 text-base leading-relaxed text-muted-foreground'>
                <p>
                  Keynes runs on standard PostgreSQL. Run it in-process with
                  PGLite, host it in our cloud or yours, or embed it directly
                  into your own database.
                </p>
                <p>Apache-2.0.</p>
              </div>
            </article>
          </SectionContent>
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
