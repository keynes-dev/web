import { useState } from "react";

import { Card } from "@/components/ui/card";
import "./policy-decisions.css";

const requests = [
  {
    title: "Qualified lead",
    tokens: 2000,
    leadScore: 90,
    result: 'status: "approved"\nbudget: Budget',
  },
  {
    title: "Low-fit lead",
    tokens: 2000,
    leadScore: 40,
    result:
      'status: "denied"\nreasons[0]: {\n  code: "policy_ceiling",\n  resource: "tokens",\n  requested: 2000, ceiling: 1000\n}',
  },
  {
    title: "Deep research",
    tokens: 4000,
    leadScore: 90,
    result:
      'status: "denied"\nreasons[0]: {\n  code: "insufficient_available",\n  resource: "tokens",\n  requested: 4000, available: 3000\n}',
  },
] as const;

const budgetSegments = [
  { kind: "available", label: "3k available", units: 3 },
  { kind: "reserved", label: "4k reserved", units: 4 },
  { kind: "used", label: "3k used", units: 3 },
] as const;

function BudgetBar() {
  return (
    <div
      className="policy-demo__bar"
      aria-label="Model tokens: 3,000 available, 4,000 reserved, 3,000 used"
    >
      {budgetSegments.map(({ kind, units }) => (
        <i
          className={`budget-state-${kind}`}
          key={kind}
          style={{ flex: units }}
        />
      ))}
    </div>
  );
}

export function PolicyDecisions() {
  const [request, setRequest] = useState<(typeof requests)[number]>(
    requests[0],
  );

  return (
    <Card
      className="policy-demo"
      role="group"
      aria-label="Lead research policy demo"
    >
      <div className="policy-demo__setup">
        <section className="policy-demo__rules" aria-labelledby="reply-policy">
          <h3 id="reply-policy">lead_research.sql</h3>
          <pre>
            <code>{`CASE WHEN context.lead_score >= 80\n  THEN 4000\n  ELSE 1000\nEND AS ceiling`}</code>
          </pre>
          <details className="policy-demo__query">
            <summary>Full query</summary>
            <pre>
              <code>{`SELECT requested.resource AS resource,\n  CASE WHEN context.lead_score >= 80\n    THEN 4000 ELSE 1000\n  END AS ceiling,\n  'research_limit' AS reason\nFROM requested_resources AS requested\nINNER JOIN available_resources AS available\n  USING (resource)\nCROSS JOIN policy_context AS context`}</code>
            </pre>
          </details>
        </section>
        <div className="policy-demo__budget">
          <h3>budget.inspect()</h3>
          <p>
            Model tokens <strong>10k total</strong>
          </p>
          <BudgetBar />
          <div className="policy-demo__bar-legend">
            {budgetSegments.map(({ kind, label }) => (
              <span key={kind}>
                <i className={`budget-state-${kind}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="policy-demo__examples" aria-label="Request examples">
        {requests.map((example) => (
          <button
            type="button"
            key={example.title}
            aria-pressed={example === request}
            onClick={() => setRequest(example)}
          >
            {example.title}
          </button>
        ))}
      </div>
      <div className="policy-demo__exchange">
        <div className="policy-demo__request">
          <h3>Request</h3>
          <pre className="policy-demo__code" aria-label="Request code">
            <code>{`await budget.request(\n  { tokens: ${request.tokens} },\n  { context: { leadScore: ${request.leadScore} } }\n)`}</code>
          </pre>
        </div>
        <div className="policy-demo__response">
          <h3>Result</h3>
          <pre aria-label="Response fields">
            <code>{request.result}</code>
          </pre>
        </div>
      </div>
    </Card>
  );
}
