export const integrationGroups = [
  {
    id: "orchestration",
    title: "Orchestration",
    description:
      "Give your agent runtime live budget and policy context, so your app can choose work, models, and tools within the limits you set.",
    icon: "hugeicons:ai-brain-01",
    accent: "var(--color-green-200)",
    tools: [
      { label: "Vercel AI SDK", icon: "vercel-ai-sdk" },
      { label: "LangGraph", icon: "langgraph" },
    ],
  },
  {
    id: "observability",
    title: "Observability",
    description:
      "Carry budget and policy context through OpenTelemetry, so your existing traces show what an agent could spend, what it used, and why Keynes allowed or denied the work.",
    icon: "hugeicons:covariate",
    accent: "var(--color-sky-200)",
    tools: [
      { label: "Grafana", icon: "grafana" },
      { label: "Datadog", icon: "datadog-icon" },
      { label: "PostHog", icon: "posthog-icon" },
      { label: "Sentry", icon: "sentry-icon" },
      { label: "Langfuse", icon: "langfuse" },
    ],
  },
  {
    id: "usage",
    title: "Usage",
    description:
      "Connect Keynes to model and tool providers to forecast spend before work starts, then settle each budget against the usage they report.",
    icon: "hugeicons:coins-01",
    accent: "var(--color-orange-200)",
    tools: [
      { label: "Gemini", icon: "google-gemini-icon" },
      { label: "OpenAI", icon: "openai-icon" },
      { label: "Anthropic", icon: "anthropic-icon" },
      { label: "Twilio", icon: "twilio-icon" },
      { label: "Firecrawl", icon: "firecrawl" },
    ],
  },
] as const;

export type IntegrationGroup = (typeof integrationGroups)[number];
