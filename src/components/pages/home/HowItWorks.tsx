import { BudgetTree } from "./BudgetTree";
import { ExperimentSweep } from "./ExperimentSweep";
import { PolicyDecisions } from "./PolicyDecisions";
import { Section } from "@/components/Section";
import { SectionTitle } from "@/components/SectionHeader";
import "@/styles/sections.css";
import "./resource-states.css";

const steps = [
  {
    id: "budgets",
    label: "Budgets",
    title: "Give every agent a budget.",
    body: "A furniture retailer uses agents to create product listings and help customers with deliveries. Give each team the tokens, image generations, API calls, and messages its work needs.",
    detail:
      "Give each workflow the resources it needs, within its team’s limits.",
    Figure: BudgetTree,
  },
  {
    id: "policies",
    label: "Policies",
    title: "Agents ask before they act.",
    body: "Define policies in SQL. Attach them to a budget. Pass context with each request.",
    detail: "Get a funded child budget or the reasons for denial.",
    Figure: PolicyDecisions,
  },
  {
    id: "experiments",
    label: "Experiments",
    title: "Find the right budget.",
    body: "Run the same support tickets with different token budgets and search limits. Compare how many tickets get resolved to see where extra spending helps.",
    detail: "Use what you learn to set the limits for your next run.",
    Figure: ExperimentSweep,
  },
] as const;

export function HowItWorks() {
  return (
    <>
      {steps.map(({ id, label, title, body, detail, Figure }, index) => (
        <Section
          id={`how-${id}`}
          aria-label={label}
          containerClassName="py-16 max-[479px]:px-5"
          key={id}
        >
          {index === 0 && (
            <p className="type-eyebrow mb-12 text-muted-foreground uppercase">
              How it works
            </p>
          )}
          <article className="section-scene">
            <div>
              <p className="type-eyebrow">
                0{index + 1} / {label}
              </p>
              <SectionTitle className="my-5 max-w-[22ch]">{title}</SectionTitle>
              <p className="type-body max-w-[42ch]">{body}</p>
              <p className="type-body mt-6 max-w-[40ch] text-muted-foreground">
                {detail}
              </p>
            </div>
            <div className="section-illustration">
              <Figure />
            </div>
          </article>
        </Section>
      ))}
    </>
  );
}
