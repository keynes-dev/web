import { Section } from "@/components/Section";
import "@/styles/sections.css";
import { ExperimentSweep } from "./ExperimentSweep";

export function ExperimentSection() {
  return (
    <Section id="how-experiments" aria-label="Experiments">
      <article className="section-scene">
        <header className="relative space-y-4">
          <p className="font-mono text-[0.6875rem] leading-[1.5] tracking-[0.05em] uppercase text-muted-foreground">
            03 / Experiments
          </p>
          <h2>Find the right budget.</h2>
          <div className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            <p className="max-w-[42ch] text-foreground">
              Run the same support tickets with different token budgets and
              search limits. Compare how many tickets get resolved to see where
              extra spending helps.
            </p>
            <p className="mt-6 max-w-[40ch]">
              Use what you learn to set the limits for your next run.
            </p>
          </div>
        </header>
        <div className="section-illustration">
          <ExperimentSweep />
        </div>
      </article>
    </Section>
  );
}
