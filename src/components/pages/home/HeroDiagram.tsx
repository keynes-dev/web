import { useEffect, useState } from "react";

import { Arrow, type ArrowPosition } from "./Arrow";
import { Ascii } from "./Ascii";
import { HeroResourcesChart } from "./HeroResourcesChart";
import { Section } from "@/components/Section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HeroResourceRow } from "@/lib/charts";
import {
  heroDeniedResponse,
  heroFirstApprovedResponse,
  heroFirstRequest,
  heroPolicy,
  heroRetryApprovedResponse,
  heroRetryRequest,
  heroSecondRequest,
  heroWaitingResponse,
} from "@/lib/diagrams";
import { cn } from "@/lib/utils";

type ResponseView =
  | { readonly kind: "pending"; readonly html: string }
  | { readonly kind: "approved"; readonly html: string }
  | { readonly kind: "denied"; readonly html: string };

interface HeroFrame {
  readonly indicatorPosition: ArrowPosition;
  readonly durationMs: number;
  readonly fading: boolean;
  readonly requestHtml: string;
  readonly resources: readonly HeroResourceRow[];
  readonly response: ResponseView;
}

const INITIAL_RESOURCES = [
  { name: "tokens", used: 0, reserved: 0, available: 10, display: "10,000" },
  { name: "toolCalls", used: 0, reserved: 0, available: 10, display: "10" },
] satisfies readonly HeroResourceRow[];

const FIRST_RESERVATION = [
  { name: "tokens", used: 0, reserved: 4, available: 6, display: "6,000" },
  { name: "toolCalls", used: 0, reserved: 3, available: 7, display: "7" },
] satisfies readonly HeroResourceRow[];

const AFTER_FIRST_RUN = [
  { name: "tokens", used: 3, reserved: 0, available: 7, display: "7,000" },
  { name: "toolCalls", used: 2, reserved: 0, available: 8, display: "8" },
] satisfies readonly HeroResourceRow[];

const FINAL_RESERVATION = [
  { name: "tokens", used: 3, reserved: 5, available: 2, display: "2,000" },
  { name: "toolCalls", used: 2, reserved: 3, available: 5, display: "5" },
] satisfies readonly HeroResourceRow[];

const pendingResponse = {
  kind: "pending",
  html: heroWaitingResponse,
} satisfies ResponseView;
const firstApprovedResponse = {
  kind: "approved",
  html: heroFirstApprovedResponse,
} satisfies ResponseView;
const deniedResponse = {
  kind: "denied",
  html: heroDeniedResponse,
} satisfies ResponseView;
const retryApprovedResponse = {
  kind: "approved",
  html: heroRetryApprovedResponse,
} satisfies ResponseView;

const frames = [
  {
    indicatorPosition: "app",
    durationMs: 700,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: INITIAL_RESOURCES,
    response: pendingResponse,
  },
  {
    indicatorPosition: "transit",
    durationMs: 700,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: INITIAL_RESOURCES,
    response: pendingResponse,
  },
  {
    indicatorPosition: "keynes",
    durationMs: 800,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: FIRST_RESERVATION,
    response: pendingResponse,
  },
  {
    indicatorPosition: "transit",
    durationMs: 700,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: FIRST_RESERVATION,
    response: pendingResponse,
  },
  {
    indicatorPosition: "app",
    durationMs: 1_300,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: FIRST_RESERVATION,
    response: firstApprovedResponse,
  },
  {
    indicatorPosition: "app",
    durationMs: 800,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: FIRST_RESERVATION,
    response: pendingResponse,
  },
  {
    indicatorPosition: "transit",
    durationMs: 700,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: FIRST_RESERVATION,
    response: pendingResponse,
  },
  {
    indicatorPosition: "keynes",
    durationMs: 900,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: AFTER_FIRST_RUN,
    response: pendingResponse,
  },
  {
    indicatorPosition: "transit",
    durationMs: 600,
    fading: false,
    requestHtml: heroFirstRequest,
    resources: AFTER_FIRST_RUN,
    response: pendingResponse,
  },
  {
    indicatorPosition: "app",
    durationMs: 800,
    fading: false,
    requestHtml: heroSecondRequest,
    resources: AFTER_FIRST_RUN,
    response: pendingResponse,
  },
  {
    indicatorPosition: "transit",
    durationMs: 700,
    fading: false,
    requestHtml: heroSecondRequest,
    resources: AFTER_FIRST_RUN,
    response: pendingResponse,
  },
  {
    indicatorPosition: "keynes",
    durationMs: 800,
    fading: false,
    requestHtml: heroSecondRequest,
    resources: AFTER_FIRST_RUN,
    response: pendingResponse,
  },
  {
    indicatorPosition: "transit",
    durationMs: 700,
    fading: false,
    requestHtml: heroSecondRequest,
    resources: AFTER_FIRST_RUN,
    response: pendingResponse,
  },
  {
    indicatorPosition: "app",
    durationMs: 1_500,
    fading: false,
    requestHtml: heroSecondRequest,
    resources: AFTER_FIRST_RUN,
    response: deniedResponse,
  },
  {
    indicatorPosition: "app",
    durationMs: 800,
    fading: false,
    requestHtml: heroRetryRequest,
    resources: AFTER_FIRST_RUN,
    response: pendingResponse,
  },
  {
    indicatorPosition: "transit",
    durationMs: 700,
    fading: false,
    requestHtml: heroRetryRequest,
    resources: AFTER_FIRST_RUN,
    response: pendingResponse,
  },
  {
    indicatorPosition: "keynes",
    durationMs: 800,
    fading: false,
    requestHtml: heroRetryRequest,
    resources: FINAL_RESERVATION,
    response: pendingResponse,
  },
  {
    indicatorPosition: "transit",
    durationMs: 700,
    fading: false,
    requestHtml: heroRetryRequest,
    resources: FINAL_RESERVATION,
    response: pendingResponse,
  },
  {
    indicatorPosition: "app",
    durationMs: 1_800,
    fading: false,
    requestHtml: heroRetryRequest,
    resources: FINAL_RESERVATION,
    response: retryApprovedResponse,
  },
  {
    indicatorPosition: "app",
    durationMs: 300,
    fading: true,
    requestHtml: heroRetryRequest,
    resources: FINAL_RESERVATION,
    response: retryApprovedResponse,
  },
] satisfies readonly HeroFrame[];

const DENIED_FRAME_INDEX = 13;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface CodePaneProps {
  html: string;
  label: string;
}

function CodePane({ html, label }: CodePaneProps) {
  return (
    <div aria-label={label} className="h-36 overflow-hidden sm:h-40">
      <Ascii className="h-full !overflow-hidden p-4" html={html} />
    </div>
  );
}

function ResponseDecision({ response }: { response: ResponseView }) {
  switch (response.kind) {
    case "pending":
      return null;
    case "approved":
      return <span className="text-lime-300">[✓] APPROVED</span>;
    case "denied":
      return <span className="text-destructive">[x] DENIED</span>;
    default: {
      const exhaustive: never = response;
      return exhaustive;
    }
  }
}

export function HeroDiagram() {
  const [frameIndex, setFrameIndex] = useState(0);
  const frame = frames[frameIndex] ?? frames[0];

  useEffect(() => {
    if (prefersReducedMotion()) {
      setFrameIndex(DENIED_FRAME_INDEX);
      return;
    }

    const timer = window.setTimeout(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, frame.durationMs);
    return () => window.clearTimeout(timer);
  }, [frame.durationMs, frameIndex]);

  const contentClassName = cn(
    "transition-opacity duration-300",
    frame.fading ? "opacity-0" : "opacity-100",
  );

  return (
    <Section className="flex flex-col gap-8">
      <header className="max-w-2xl space-y-3">
        <h2 className="font-heading text-3xl tracking-tight">
          Agents ask before they act.
        </h2>
        <p className="text-muted-foreground">
          Your app sends Keynes a request. Keynes checks business rules and
          available resources, holds what it approves, and records what happened
          when the work is done.
        </p>
      </header>

      <div
        className="flex flex-col items-center gap-6 xl:flex-row xl:items-stretch"
        data-resetting={frame.fading ? "true" : "false"}
        data-testid="hero-flow"
      >
        <Card className="h-[25rem] w-full min-w-0 xl:flex-1">
          <CardHeader className="border-b">
            <CardTitle>Keynes</CardTitle>
          </CardHeader>
          <CardContent
            className={cn("flex flex-1 flex-col px-0", contentClassName)}
          >
            <div className="border-b bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground">
              Budget
            </div>
            <div className="p-4">
              <HeroResourcesChart resources={frame.resources} />
            </div>
            <div className="border-y bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground">
              Policy
            </div>
            <CodePane html={heroPolicy} label="Policy code" />
          </CardContent>
        </Card>
        <div
          className={cn(
            "hidden shrink-0 self-center text-muted-foreground xl:block",
            contentClassName,
          )}
        >
          <Arrow position={frame.indicatorPosition} />
        </div>
        <div
          className={cn("text-muted-foreground xl:hidden", contentClassName)}
        >
          <Arrow position={frame.indicatorPosition} vertical />
        </div>
        <Card className="h-[25rem] w-full min-w-0 xl:flex-1">
          <CardHeader className="border-b">
            <CardTitle>App</CardTitle>
          </CardHeader>
          <CardContent
            className={cn("flex flex-1 flex-col px-0", contentClassName)}
          >
            <div className="border-b bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground">
              request
            </div>
            <CodePane html={frame.requestHtml} label="Application code" />
            <div className="flex min-h-9 items-center justify-between border-y bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground">
              <span>response</span>
              <span aria-live="polite">
                <ResponseDecision response={frame.response} />
              </span>
            </div>
            <Ascii className="flex-1 p-4" html={frame.response.html} />
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
