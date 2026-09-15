import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import { AccessLinks } from "./AccessLinks";

export function Hero() {
  return (
    <Section className='bg-orange-100'>
      <SectionFrame>
        <SectionColumn>
          <svg
            className='pointer-events-none absolute inset-0 size-full text-border/10'
            aria-hidden='true'
          >
            <defs>
              <pattern
                id='hero-grid'
                width='32'
                height='16'
                patternUnits='userSpaceOnUse'
              >
                <path
                  d='M0 8 16 0 32 8 16 16Z'
                  fill='none'
                  stroke='currentColor'
                />
              </pattern>
            </defs>
            <rect width='100%' height='100%' fill='url(#hero-grid)' />
          </svg>
          <SectionContent className='z-10'>
            <div className='flex flex-col gap-6 lg:min-h-80 lg:justify-center'>
              <div className='relative lg:max-w-1/2'>
                <header className='space-y-4'>
                  <h1>Runtime economics for agents</h1>
                  <p className='max-w-3xl text-muted-foreground'>
                    Give your agents observability into your business with
                    programmable resource controls for tokens, tools, time, and
                    more.
                  </p>
                </header>
                <AccessLinks className='mt-4' />
              </div>
            </div>
          </SectionContent>
          <conveyor-belt
            className='pointer-events-none relative block h-56 border-border/10 text-foreground sm:h-64 lg:absolute lg:inset-0 lg:h-auto'
            role='img'
            aria-label='A machine sorting shapes into boxes on a conveyor belt: each box receives the shape that fits the hole in its lid, and one that arrives the wrong way up is turned over by a mechanical arm.'
          />
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
