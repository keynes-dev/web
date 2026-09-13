import { Section } from "@/components/Section";
import "@/styles/sections.css";
import { PolicyDecisions } from "./PolicyDecisions";
import "./resource-states.css";

export function PolicySection() {
  return (
    <Section id="how-policies" aria-label="Policies">
      <article className="section-scene">
        <header className="relative space-y-4">
          <p className="font-mono text-[0.6875rem] leading-[1.5] tracking-[0.05em] uppercase text-muted-foreground">
            02 / Policies
          </p>
          <h2>Agents ask before they act.</h2>
          <div className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            <p className="max-w-[42ch] text-foreground">
              Define policies in SQL. Attach them to a budget. Pass context with
              each request.
            </p>
            <p className="mt-6 max-w-[40ch]">
              Get a funded child budget or the reasons for denial.
            </p>
          </div>
        </header>
        <div className="section-illustration">
          <PolicyDecisions />
        </div>
      </article>
    </Section>
  );
}
