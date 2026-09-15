import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceBar } from "./ResourceBar";

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
      'status: "denied"\nreasons[0]: {\n  code: "policy_limit",\n  resource: "tokens",\n  requested: 2000, limit: 1000\n}',
  },
  {
    title: "Deep research",
    tokens: 4000,
    leadScore: 90,
    result:
      'status: "denied"\nreasons[0]: {\n  code: "insufficient_available",\n  resource: "tokens",\n  requested: 4000, available: 3000\n}',
  },
] as const;

export function PolicyDecisions() {
  const [request, setRequest] = useState<(typeof requests)[number]>(
    requests[0],
  );

  return (
    <Card
      className='min-w-0 text-sm'
      role='group'
      aria-label='Lead research policy demo'
    >
      <CardHeader className='grid p-0 sm:grid-cols-2'>
        <section className='min-w-0 p-3 sm:p-4' aria-labelledby='reply-policy'>
          <CardTitle className='mb-3' id='reply-policy'>
            lead_research.sql
          </CardTitle>
          <pre className='break-words whitespace-pre-wrap font-mono text-xs leading-relaxed'>
            <code>{`CASE WHEN context.lead_score >= 80\n  THEN 4000\n  ELSE 1000\nEND AS limit`}</code>
          </pre>
        </section>
        <div className='min-w-0 p-3 sm:border-t-0 sm:border-l-2 sm:p-4'>
          <CardTitle className='mb-3'>budget.inspect()</CardTitle>
          <p className='mb-2 flex justify-between gap-2 text-xs text-muted-foreground'>
            Model tokens{" "}
            <strong className='font-mono font-normal text-foreground'>
              10k total
            </strong>
          </p>
          <ResourceBar
            available={3}
            reserved={4}
            used={3}
            label='Model tokens: 3,000 available, 4,000 reserved, 3,000 used'
          />
          <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <i className='font-mono text-foreground not-italic'>▓</i> 3k
              available
            </span>
            <span className='flex items-center gap-1'>
              <i className='font-mono text-foreground/55 not-italic'>▒</i> 4k
              reserved
            </span>
            <span className='flex items-center gap-1'>
              <i className='font-mono text-foreground/25 not-italic'>░</i> 3k
              used
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <div
          className='flex gap-3 border-b-2 px-3 sm:px-4'
          aria-label='Request examples'
        >
          {requests.map((example) => (
            <button
              className='cursor-pointer border-transparent py-2 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:text-foreground dark:aria-pressed:border-primary'
              type='button'
              key={example.title}
              aria-pressed={example === request}
              onClick={() => setRequest(example)}
            >
              {example.title}
            </button>
          ))}
        </div>
        <div className='grid sm:grid-cols-2'>
          <div className='min-w-0 p-3 sm:p-4'>
            <h3 className='mb-2 font-mono text-sm'>Request</h3>
            <pre
              className='break-words whitespace-pre-wrap font-mono text-xs leading-relaxed text-primary-foreground'
              aria-label='Request code'
            >
              <code>{`await budget.request(\n  { tokens: ${request.tokens} },\n  { context: { leadScore: ${request.leadScore} } }\n)`}</code>
            </pre>
          </div>
          <div className='min-h-36 min-w-0 border-t-2 p-3 sm:border-t-0 sm:border-l-2 sm:p-4'>
            <h3 className='mb-2 font-mono text-sm'>Result</h3>
            <pre
              className='break-words whitespace-pre-wrap font-mono text-xs leading-relaxed'
              aria-label='Response fields'
            >
              <code>{request.result}</code>
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
