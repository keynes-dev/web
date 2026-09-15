export const runtimeTabs = [
  {
    id: "runtime",
    label: "Runtime",
    title: "Define resource budgets",
    description:
      "See shared resources flow from the GTM budget into Growth Operations and Sales Development, with approvals and denials visible at each branch.",
  },
  {
    id: "budget",
    label: "Budget",
    title: "Give every team a clear allocation.",
    description:
      "Create the GTM budget once, then allocate data credits, AI tokens, and email sends to the teams that use them.",
  },
  {
    id: "policy",
    label: "Policy",
    title: "Turn business context into limits.",
    description:
      "Evaluate each request against live availability and lead intent, returning an explicit limit, decision, and reason.",
  },
  {
    id: "workflow",
    label: "Workflow",
    title: "Give every denial a backup plan.",
    description:
      "Request resources before doing work, follow the approved path, and switch to a cheaper plan or retry when Keynes returns a denial reason.",
  },
] as const;
