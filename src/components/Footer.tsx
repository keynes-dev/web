import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import { Logo } from "@/components/Logo";

import { SiteLinks } from "./SiteLinks";

export function Footer() {
  return (
    <footer>
      <Section>
        <SectionFrame>
          <SectionColumn>
            <SectionContent className='flex flex-col items-start justify-between gap-4 sm:py-8 md:flex-row md:items-center'>
              <div className='flex items-center gap-4'>
                <a aria-label='Keynes home' href='/'>
                  <Logo />
                </a>
                <span className='text-sm text-muted-foreground'>
                  © 2026 Keynes · Apache-2.0
                </span>
              </div>
              <SiteLinks />
            </SectionContent>
          </SectionColumn>
        </SectionFrame>
      </Section>
    </footer>
  );
}
