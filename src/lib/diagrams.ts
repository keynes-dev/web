/**
 * ASCII figures for the landing page (policy snippets and deployment glyphs).
 */

import { baseRules, codeRules, paintAscii, rep, type Rule } from "./ascii";

const nameRule = (words: string[], cls = "c-dark"): Rule => ({
  re: new RegExp(`\\b(${words.join("|").replace(/ /g, "\\ ")})\\b`),
  cls,
});

/* ---------------- home tabs: Budgets / Policies / Experiments ---------------- */

const tabRules: Rule[] = [
  ...baseRules,
  {
    re: /\b(org|team|workflow|run|request|revise|retry|sweep|measure|plot)\b/,
    cls: "c-muted",
  },
  { re: /\b(tokens|toolCalls|retries|leadScore)\b/, cls: "c-green" },
  { re: /\bBINDS\b/, cls: "c-amber" },
  { re: /\[x\] DENIED|\bDENIED\b/, cls: "c-tomato" },
  { re: /\b(ok|ALLOW|pass)\b/, cls: "c-muted" },
  { re: /[*o]+/, cls: "c-plum" },
  { re: /#+/, cls: "c-amber" },
  { re: /[Xx]/, cls: "c-tomato" },
  { re: /\^knee|frontier|dominated|knee/, cls: "c-muted" },
  nameRule([
    "acme",
    "support",
    "sales",
    "ticket-triage",
    "qualify",
    "escalations",
    "seat_policy",
    "tier_policy",
    "budget_policy",
    "risk_policy",
  ]),
];

/*
  Org Budget splits into team Budgets; each team splits into workflows;
  each workflow splits into runs. Boxes and forks only — no tree list.
*/
export const budgetsTab = paintAscii(
  [
    "                    +------------------------+",
    "                    | org:acme               |",
    "                    | tokens 96,000          |",
    "                    +-----------+------------+",
    "                                |",
    "              +-----------------+-----------------+",
    "              |                                   |",
    "              v                                   v",
    "   +------------------------+          +------------------------+",
    "   | team:support           |          | team:sales             |",
    "   | tokens 24,000          |          | tokens 18,000          |",
    "   +-----------+------------+          +-----------+------------+",
    "               |                                   |",
    "        +------+------+                            |",
    "        |             |                            |",
    "        v             v                            v",
    " +---------------+ +---------------+        +---------------+",
    " | ticket-triage | | escalations   |        | qualify       |",
    " | tokens 8k     | | tokens 4k     |        | tokens 6k     |",
    " +-------+-------+ +-------+-------+        +-------+-------+",
    "         |                 |                        |",
    "    +----+----+            |                 +------+------+",
    "    |         |            |                 |             |",
    "    v         v            v                 v             v",
    "  +-----+   +-----+     +-----+       +-----------+ +-----------+",
    "  |#4812|   |#4813|     |#2201|       | run #902  | | run #903  |",
    "  |2.4k |   |1.8k |     |1.2k |       | 1,500 tok | | 1,100 tok |",
    "  +-----+   +-----+     +-----+       +-----------+ +-----------+",
  ],
  tabRules,
);

/*
  A request flows down a stack of Policy gates. Lower ceilings still pass
  until risk_policy binds and the flow splits to DENIED or revise/retry.
*/
export const policiesTab = paintAscii(
  [
    "           +------------------------------+",
    "           | request                      |",
    "           | tokens 1,800   leadScore 84  |",
    "           +--------------+---------------+",
    "                          |",
    "                          v",
    "           +--------------+---------------+",
    "           | seat_policy                  |----> ok  2,500",
    "           +--------------+---------------+",
    "                          |",
    "                          v",
    "           +--------------+---------------+",
    "           | tier_policy                  |----> ok  2,200",
    "           +--------------+---------------+",
    "                          |",
    "                          v",
    "           +--------------+---------------+",
    "           | budget_policy                |----> ok  1,800",
    "           +--------------+---------------+",
    "                          |",
    "                          v",
    "           +--------------+---------------+",
    "           | risk_policy     BINDS 1,000  |",
    "           +-------+--------------+-------+",
    "                   |              |",
    "          +--------+              +--------+",
    "          |                                |",
    "          v                                v",
    "  +----------------+              +----------------+",
    "  | [x] DENIED     |              | revise ask     |",
    "  | short by 800   |              | then retry --> |",
    "  +----------------+              +----------------+",
  ],
  [...codeRules, ...tabRules],
);

/*
  One sweep fans into variant runs, measures land as a scatter, and the
  frontier picks the knee for a Policy ceiling.
*/
export const experimentsTab = paintAscii(
  [
    "                    +------------------------+",
    "                    | sweep configs          |",
    "                    | tokens x prompts       |",
    "                    +-----------+------------+",
    "                                |",
    "        +-----------+-----------+-----------+-----------+",
    "        |           |           |           |           |",
    "        v           v           v           v           v",
    "   +--------+  +--------+  +--------+  +--------+  +--------+",
    "   | run A  |  | run B  |  | run C  |  | run D  |  | run E  |",
    "   | 800    |  | 1,200  |  | 1,400  |  | 1,600  |  | 2,000  |",
    "   +---+----+  +---+----+  +---+----+  +---+----+  +---+----+",
    "       |           |           |           |           |",
    "       +-----+-----+-----+-----+-----+-----+-----+-----+",
    "             |",
    "             v",
    "   +---------+------------------------------------------+",
    "   | measure                                            |",
    "   |                                                    |",
    "   |  %r                                                |",
    "   |  95 |          o  ##o##  o                         |",
    "   |  90 |       o ###      ##  o    o                  |",
    "   |  85 |    o ###           ## o      x ungoverned    |",
    "   |  80 |  o##         o       ##  o                   |",
    "   |  70 | o#        o            ##                    |",
    "   |  60 |#      o                                      |",
    "   |     +--+----+----+----+----> tokens                |",
    "   |       800  ^knee 1600 2000                         |",
    "   |            # frontier   o measured                 |",
    "   +---------+------------------------------------------+",
    "             |",
    "             v",
    "   +---------+--------------+",
    "   | set Policy ceiling     |",
    "   | knee @ 1,200 tokens    |",
    "   +------------------------+",
  ],
  tabRules,
);

/* ---------------- hero: Policy / App ---------------- */

export const heroPolicy = paintAscii(
  [
    "const reserve = definePolicy(resources, {",
    '  name: "operating_reserve",',
    '  inputs: ["tokens"],',
    '  outputs: ["tokens"],',
    '  reasons: ["keep_2000_tokens"],',
    "  query: ({ db, sql }) => db",
    '    .selectFrom("requested_resources as requested")',
    '    .innerJoin("available_resources as available",',
    '      (join) => join.onRef("available.resource", "=", "requested.resource"))',
    "    .select(({ eb }) => [",
    '      "requested.resource as resource",',
    '      sql<number>`greatest(${eb.ref("available.amount")} - 2000, 0)`',
    '        .as("ceiling"),',
    '      eb.val("keep_2000_tokens").as("reason"),',
    "    ]),",
    "});",
  ],
  codeRules,
);

function heroRequest(tokens: string): string {
  return paintAscii(
    [
      "const grant = await budget.request({",
      `  resources: { tokens: ${tokens}, toolCalls: 3 },`,
      "});",
      'if (grant.status === "approved") {',
      '  const used = await runWorkflow("qualify", grant.budget);',
      "  await grant.budget.settle({",
      "    tokens: 3_000, toolCalls: 2,",
      "  });",
      "}",
    ],
    codeRules,
  );
}

export const heroFirstRequest = heroRequest("4_000");
export const heroSecondRequest = heroRequest("6_000");
export const heroRetryRequest = heroRequest("5_000");

const responseRules: Rule[] = [
  {
    re: /\b(status|budget|code|resource|requested|ceiling|available|tokens|toolCalls)\b/,
    cls: "c-prop",
  },
  {
    re: /\b(approved|denied|policy_ceiling|run-0042|run-0043)\b/,
    cls: "c-str",
  },
  { re: /\b\d[\d,]*\b/, cls: "c-num" },
  { re: /\bdenied\b/, cls: "c-tomato" },
];

export const heroWaitingResponse = paintAscii(
  ["", "", "", "", "", ""],
  responseRules,
);

export const heroFirstApprovedResponse = paintAscii(
  [
    "status      approved",
    "budget      run-0042",
    "tokens      4,000",
    "toolCalls   3",
    "",
    "",
  ],
  responseRules,
);

export const heroDeniedResponse = paintAscii(
  [
    "status      denied",
    "code        policy_ceiling",
    "resource    tokens",
    "requested   6,000",
    "ceiling     5,000",
    "available   7,000",
  ],
  responseRules,
);

export const heroRetryApprovedResponse = paintAscii(
  [
    "status      approved",
    "budget      run-0043",
    "tokens      5,000",
    "toolCalls   3",
    "",
    "",
  ],
  responseRules,
);

/* ---------------- deployments: three glyphs ---------------- */

const GLYPH_WIDTH = 44;

function glyphBox(title: string, body: string[]): string[] {
  const inner = GLYPH_WIDTH - 2;
  return [
    "+-- " + title + " " + rep("-", GLYPH_WIDTH - 6 - title.length) + "+",
    ...body.map((line) => "|" + line.padEnd(inner).substring(0, inner) + "|"),
    "+" + rep("-", inner) + "+",
  ];
}

const glyphRules: Rule[] = [
  ...baseRules,
  { re: /\[ [^\]]+ \]/, cls: "c-dark" },
  { re: /keynes\.\*/, cls: "c-green" },
  { re: /network/, cls: "c-muted" },
  nameRule([
    "node process",
    "your postgresql 18.6",
    "one transaction",
    "your app",
    "keynes",
  ]),
];

export const localGlyph = paintAscii(
  [...glyphBox("node process", ["", "   [ app ]  <------->  [ sqlite ]", ""])],
  glyphRules,
);

const transactionBox = (() => {
  const inner = 38 - 2;
  const title = "one transaction";
  return [
    "+-- " + title + " " + rep("-", 38 - 6 - title.length) + "+",
    "|" + "  [ your row ]      [ keynes.* ]".padEnd(inner) + "|",
    "+" + rep("-", inner) + "+",
  ];
})();

export const embeddedGlyph = paintAscii(
  [
    ...glyphBox(
      "your postgresql 18.6",
      transactionBox.map((line) => "  " + line),
    ),
  ],
  glyphRules,
);

export const hostedGlyph = paintAscii(
  [
    "+-- your app ------+  network  +-- keynes -+",
    "|                  |     :     |  service  |",
    "|   remote sdk     |-----:---->|  postgres |",
    "|                  |     :     |           |",
    "+------------------+     :     +-----------+",
  ],
  glyphRules,
);
