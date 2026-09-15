export const runtimeCode = {
  budgets: `import { keynes } from "Keynes";

// Create root budget
const gtm = await keynes.createBudget({
  dataCredits: 100_000,
  aiTokens: 30_000_000,
  emailSends: 25_000,
});

// Allocate resources to sub budgets
const growthOperations = await gtm.request({
  dataCredits: 60_000,
  aiTokens: 18_000_000,
});

const salesDevelopment = await gtm.request({
  aiTokens: 10_000_000,
  emailSends: 20_000,
});`,
  policies: `WITH intent_limit AS (
  SELECT CASE
    WHEN intent_score >= 80 THEN 6
    ELSE 2
  END AS amount
  FROM policy_context
)
SELECT
  r.resource,
  LEAST(a.amount, l.amount)
    AS resource_limit,
  CASE
    WHEN r.amount > l.amount
      THEN 'intent_limit_exceeded'
    ELSE 'within_intent_limit'
  END AS reason
FROM requested_resources r
JOIN available_resources a
  USING (resource)
CROSS JOIN intent_limit l;`,
  workflow: `async function enrichLead(lead: Lead) {
  const budget = growthOperations.budget;

  // Request workflow resources
  const result = await budget.request(
    { dataCredits: 6, aiTokens: 2_000 },
    { context: { intentScore: lead.intentScore } },
  );

  // Use resources
  if (result.status === "approved") {
    return runFullEnrichment(lead, result.budget);
  }

  const hasReason = (code: string) =>
    result.reasons.some(
      (reason) => reason.code === code,
    );

  // Try cheaper workflow
  if (hasReason("intent_limit_exceeded")) {
    return runEmailOnlyWaterfall(lead);
  }

  // Wait for resource availability
  if (hasReason("resource_unavailable")) {
    return retryAfterBudgetRefresh(lead);
  }

  return skipLead(lead);
}`,
} as const;

export const policyLineCount = runtimeCode.policies.split("\n").length;
