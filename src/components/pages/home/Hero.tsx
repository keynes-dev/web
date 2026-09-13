import { Section } from "@/components/Section";
import { AccessLinks } from "./AccessLinks";

export function Hero() {
  return (
    <Section containerClassName="relative flex min-h-[40rem] flex-col justify-start overflow-hidden pt-8 pb-24 lg:min-h-[32rem] lg:justify-center lg:py-24">
      <conveyor-belt
        className="pointer-events-none absolute inset-0 border-emerald-700 bg-background"
        role="img"
        aria-label="A machine sorting shapes into boxes on a conveyor belt: each box receives the shape that fits the hole in its lid, and one that arrives the wrong way up is turned over by a mechanical arm."
      />
      <div className="relative flex flex-col gap-4">
        <h1 className="type-display">Runtime economics for agents</h1>
        <p className="type-lead lg:max-w-[50%]">
          Give your agents observability into your business with programmable
          resource controls for tokens, tools, time, and more.
        </p>
        <AccessLinks className="mt-2" />
      </div>
    </Section>
  );
}
