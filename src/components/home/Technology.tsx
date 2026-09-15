import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";

export function Technology() {
  return (
    <Section aria-label='Technology'>
      <SectionFrame className='border-dashed'>
        <SectionColumn className='border-dashed'>
          <SectionContent>
            <article className='relative z-10 flex flex-col gap-4 lg:flex-row lg:gap-16'>
              <h2 className='shrink-0'>It's just Postgres</h2>
              <div className='space-y-4 text-base leading-relaxed text-muted-foreground'>
                <p>
                  Keynes is a collection of PostgreSQL tables and functions.
                  Policies are defined in SQL. Everything is portable. We
                  support running it in-process via PGLite, hosting it on our
                  managed cloud service, or embedding it directly into your own
                  database so that you can enforce policies inside transactions
                  and connect directly to your app data without a network
                  roundtrip.
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
