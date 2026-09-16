export const policyExamples = [
  {
    id: "sales",
    tab: "Sales",
    file: "lead-enrichment-policy.ts",
    policy: `const salesPolicy = db
  .selectFrom("opportunity")
  .select((eb) =>
    eb.case()
      .when("stage", "=", "qualified")
      .then(8).else(2)
      .end().as("dataCredits"),
  );`,
    requested: 6,
    available: 12,
    conditions: [
      { name: "Qualified opportunity", limit: 8 },
      { name: "New lead", limit: 2 },
    ],
  },
  {
    id: "support",
    tab: "Support",
    file: "ticket-traige-policy.ts",
    policy: `const supportPolicy = db
  .selectFrom("ticket")
  .select((eb) =>
    eb.case()
      .when("priority", "=", "urgent")
      .then(30).else(10)
      .end().as("minutes"),
  );`,
    requested: 25,
    available: 45,
    conditions: [
      { name: "Urgent", limit: 30 },
      { name: "Normal", limit: 10 },
    ],
  },
  {
    id: "engineering",
    tab: "Engineering",
    file: "ci-remediation-policy.ts",
    policy: `const ciRemediationPolicy = db
  .selectFrom("ci_failure")
  .select((eb) =>
    eb.case()
      .when("workClass", "=", "release_blocker")
      .then(45).else(10)
      .end().as("sandboxMinutes"),
  );`,
    requested: 30,
    available: 60,
    conditions: [
      { name: "Release blocker", limit: 45 },
      { name: "Routine PR", limit: 10 },
    ],
  },
] as const;
