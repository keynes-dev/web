import { Section } from "@/components/Section";
import { AccessLinks } from "./AccessLinks";

export function Hero() {
  return (
    <Section>
      <div className='flex min-h-96 flex-col justify-center gap-6'>
        <conveyor-belt
          className='pointer-events-none absolute inset-0 block border-grid bg-background text-muted-foreground'
          role='img'
          aria-label='A machine sorting shapes into boxes on a conveyor belt: each box receives the shape that fits the hole in its lid, and one that arrives the wrong way up is turned over by a mechanical arm.'
        />
        <div className='relative lg:max-w-1/2'>
          <header className='space-y-4'>
            <h1>Runtime economics for agents</h1>
            <p className='max-w-3xl text-base leading-relaxed'>
              Give your agents observability into your business with
              programmable resource controls for tokens, tools, time, and more.
            </p>
          </header>
          <AccessLinks className='mt-4' />
        </div>
      </div>
    </Section>
  );
}
