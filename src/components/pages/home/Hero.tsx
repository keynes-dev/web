import { ArrowRight } from "lucide-react";

import { Section } from "@/components/Section";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <Section className='relative flex min-h-[40rem] flex-col justify-start overflow-hidden pt-8 pb-24 lg:min-h-[32rem] lg:justify-center lg:py-24'>
      <conveyor-belt
        className='pointer-events-none absolute inset-0'
        role='img'
        aria-label='A machine sorting shapes into boxes on a conveyor belt: each box receives the shape that fits the hole in its lid, and one that arrives the wrong way up is turned over by a mechanical arm.'
      />
      <div className='relative flex flex-col gap-4'>
        <h1 className='font-heading text-4xl tracking-tight text-balance'>
          Runtime economics for agents
        </h1>
        <p className='text-lg lg:max-w-[50%]'>
          Give your agents observability into your business with programmable
          resource controls for tokens, tools, time, and more.
        </p>
        <div className='mt-2 flex flex-wrap gap-3'>
          <Button asChild size='lg'>
            <a href='/access'>
              Get access today
              <ArrowRight data-icon='inline-end' />
            </a>
          </Button>
          <Button asChild size='lg' variant='outline'>
            <a href='/docs'>Read docs</a>
          </Button>
        </div>
      </div>
    </Section>
  );
}
