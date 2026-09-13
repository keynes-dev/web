import { Section } from "@/components/Section";
import { PolicyDecisions } from "./PolicyDecisions";

export function PolicySection() {
  return (
    <Section id="how-policies" aria-label="Policies">
      <article className="grid min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <header className="relative space-y-4">
          <p className="font-mono text-xs leading-normal tracking-wider uppercase text-muted-foreground">
            02 / Policies
          </p>
          <h2>Agents ask before they act.</h2>
          <div className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            <p className="max-w-md text-foreground">
              Define policies in SQL. Attach them to a budget. Pass context with
              each request.
            </p>
            <p className="mt-6 max-w-md">
              Get a funded child budget or the reasons for denial.
            </p>
          </div>
        </header>
        <div className="min-w-0 py-5">
          <PolicyDecisions />
        </div>
      </article>
    </Section>
  );
}
