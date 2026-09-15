import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "./Section";

export function SectionDivider() {
  return (
    <Section className='relative'>
      <svg
        className='pointer-events-none absolute inset-0 size-full text-border/15'
        aria-hidden='true'
      >
        <defs>
          <pattern
            id='section-divider-hatch'
            width='8'
            height='8'
            patternUnits='userSpaceOnUse'
          >
            <path
              d='M-2 2L2 -2M0 8L8 0M6 10L10 6'
              fill='none'
              stroke='currentColor'
              strokeWidth='1'
            />
          </pattern>
        </defs>
        <rect width='100%' height='100%' fill='url(#section-divider-hatch)' />
      </svg>
      <SectionFrame className='relative z-10 border-none'>
        <SectionColumn className='border-none'>
          <SectionContent className='px-2 py-2 sm:px-2 sm:py-2' />
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
