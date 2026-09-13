import { useEffect, useRef, useState } from "react";

import { BudgetTree } from "./BudgetTree";
import { ExperimentSweep } from "./ExperimentSweep";
import { PolicyDecisions } from "./PolicyDecisions";
import { Section } from "@/components/Section";
import "./how-it-works.css";
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
];

function usePinnedSteps(stepCount: number) {
  const sectionRef = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const query = window.matchMedia(
      "(min-width: 1024px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)",
    );
    const syncLayout = () => setPinned(query.matches);
    syncLayout();
    query.addEventListener("change", syncLayout);
    return () => query.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    let frame = 0;
    const syncStep = () => {
      const section = sectionRef.current;
      if (!section) return;
      const { top, height } = section.getBoundingClientRect();
      const distance = height - window.innerHeight;
      const progress = distance > 0 ? -top / distance : 0;
      setActive(
        Math.max(0, Math.min(stepCount - 1, Math.floor(progress * stepCount))),
      );
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(syncStep);
    };
    syncStep();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pinned, stepCount]);

  const goToStep = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const { top, height } = section.getBoundingClientRect();
    const distance = height - window.innerHeight;
    window.scrollTo({
      top: window.scrollY + top + (distance * (index + 0.15)) / stepCount,
      behavior: "instant",
    });
  };

  return { active, goToStep, pinned, sectionRef };
}

export function HowItWorks() {
  const { active, goToStep, pinned, sectionRef } = usePinnedSteps(steps.length);

  return (
    <Section
      id="how-it-works"
      aria-label="How it works"
      ref={sectionRef}
      data-pinned={pinned}
      containerClassName="how-it-works"
    >
      <div className="how-it-works__stage">
        <p className="how-it-works__eyebrow">How it works</p>
        <div className="how-it-works__scenes">
          {steps.map(({ id, label, title, body, detail, Figure }, index) => (
            <article
              id={`how-${id}`}
              className="how-it-works__scene"
              data-active={index === active}
              aria-hidden={pinned && index !== active ? true : undefined}
              inert={pinned && index !== active ? true : undefined}
              key={id}
            >
              <div className="how-it-works__copy">
                <p className="how-it-works__step">
                  0{index + 1} / {label}
                </p>
                <h2>{title}</h2>
                <p className="how-it-works__body">{body}</p>
                <p className="how-it-works__detail">{detail}</p>
              </div>
              <div className="how-it-works__illustration">
                <Figure />
              </div>
            </article>
          ))}
        </div>
        {pinned && (
          <nav className="how-it-works__nav" aria-label="How it works steps">
            {steps.map((step, index) => (
              <button
                type="button"
                aria-current={index === active ? "step" : undefined}
                aria-controls={`how-${step.id}`}
                onClick={() => goToStep(index)}
                key={step.id}
              >
                <span>0{index + 1}</span> {step.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </Section>
  );
}
