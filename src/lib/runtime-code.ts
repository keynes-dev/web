import { createCssVariablesTheme, createHighlighter } from "shiki";

const budgetCode = `import { keynes } from "Keynes";

const gtm = await keynes.createBudget({
  dataCredits: 100_000,
  aiTokens: 30_000_000,
  emailSends: 25_000,
});

const growthOperations = await gtm.request({
  dataCredits: 60_000,
  aiTokens: 18_000_000,
});

const salesDevelopment = await gtm.request({
  aiTokens: 10_000_000,
  emailSends: 20_000,
});`;

const policyCode = `SELECT
  requested.resource AS resource,
  LEAST(
    available.amount,
    CASE WHEN context.intent_score >= 80
      THEN 6 ELSE 2 END
  ) AS resource_limit,
  CASE WHEN requested.amount >
    CASE WHEN context.intent_score >= 80
      THEN 6 ELSE 2 END
    THEN 'intent_limit_exceeded'
    ELSE 'within_intent_limit'
  END AS reason
FROM requested_resources AS requested
INNER JOIN available_resources
  AS available USING (resource)
CROSS JOIN policy_context AS context;`;

const workflowCode = `async function enrichLead(lead: Lead) {
  const budget = growthOperations.budget;
  const result = await budget.request(
    { dataCredits: 6, aiTokens: 2_000 },
    { context: { intentScore: lead.intentScore } },
  );

  if (result.status === "approved") {
    return runFullEnrichment(lead, result.budget);
  }

  const hasReason = (code: string) =>
    result.reasons.some(
      (reason) => reason.code === code,
    );

  if (hasReason("intent_limit_exceeded")) {
    return runEmailOnlyWaterfall(lead);
  }

  if (hasReason("resource_unavailable")) {
    return retryAfterBudgetRefresh(lead);
  }

  return skipLead(lead);
}`;

export type RuntimeCodeHtml = {
  budgets: string;
  policies: string;
  workflow: string;
};

const theme = createCssVariablesTheme({
  name: "css-variables",
  variableDefaults: {
    foreground: "var(--foreground)",
    background: "transparent",
  },
});

export async function highlightRuntimeCode(): Promise<RuntimeCodeHtml> {
  const highlighter = await createHighlighter({
    themes: [theme],
    langs: ["typescript", "sql"],
  });

  try {
    const highlight = (code: string, lang: "sql" | "typescript") =>
      highlighter.codeToHtml(code, {
        lang,
        theme: "css-variables",
      });

    return {
      budgets: highlight(budgetCode, "typescript"),
      policies: highlight(policyCode, "sql"),
      workflow: highlight(workflowCode, "typescript"),
    };
  } finally {
    highlighter.dispose();
  }
}
