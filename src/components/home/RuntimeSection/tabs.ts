export const runtimeTabs = [
  {
    id: "runtime",
    label: "Runtime",
    title: "Give your agents the business",
    description:
      "As agents are making more and more business decisions, they need to understand your business context, policies, and resource limitations at the moment of decision. Keynes allows you to model your resource policy in code and give it to your agents as runtime context.",
  },
  {
    id: "budget",
    label: "Budget",
    title: "Budgets, all the way down.",
    description:
      "It's simple. Define a budget for your organization and the resources it uses. Then, split that budget into sub budgets for your teams, workflows, and agents. Keynes automatically manages resource requests, asynchronous usage settlement, and overages.",
  },
  {
    id: "policy",
    label: "Policy",
    title: "Define business policy as code.",
    description:
      "It's okay to have favorites. Not every workflow request is the same. Keynes allows you to use custom business context to determine which requests are approved or denied. Test and iterate policies to find the right balance between cost and quality per run.",
  },
  {
    id: "workflow",
    label: "Workflow",
    title: "Write smarter workflows.",
    description:
      "Keynes exposes a typed API of your resources, budgets, and policies so that you can write smarter code. Instead of crossing your fingers and avoiding thinking about billing failures and endless retries, give your app a backup plan and handle limitations gracefully.",
  },
] as const;
