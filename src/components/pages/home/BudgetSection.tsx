import { Section } from "@/components/Section";
import "@/styles/sections.css";
import { BudgetTree } from "./BudgetTree";
import "./resource-states.css";

export function BudgetSection() {
  return (
    <Section id="how-budgets" aria-label="Budgets">
      <article className="section-scene">
        <header className="relative space-y-4">
          <p className="font-mono text-[0.6875rem] leading-[1.5] tracking-[0.05em] uppercase text-muted-foreground">
            01 / Budgets
          </p>
          <h2>Give every agent a budget.</h2>
          <div className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            <p className="max-w-[42ch] text-foreground">
              A furniture retailer uses agents to create product listings and
              help customers with deliveries. Give each team the tokens, image
              generations, API calls, and messages its work needs.
            </p>
            <p className="mt-6 max-w-[40ch]">
              Give each workflow the resources it needs, within its team’s
              limits.
            </p>
          </div>
        </header>
        <div className="section-illustration">
          <BudgetTree />
        </div>
      </article>
    </Section>
  );
}
