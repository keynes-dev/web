import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import { AccessLinks } from "./AccessLinks";

export function ClosingCta() {
  return (
    <Section>
      <SectionFrame>
        <SectionColumn>
          <SectionContent>
            <div className='flex flex-col items-center gap-8'>
              <header className='relative max-w-3xl space-y-4 text-center'>
                <h2>Put your agents on a Budget</h2>
                <p className='text-base leading-relaxed text-muted-foreground'>
                  Apache-2.0 open core. One TypeScript SDK. Start locally with
                  zero setup — no account, no keys, no network.
                </p>
              </header>
              <AccessLinks className='justify-center' />
            </div>
          </SectionContent>
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
