export type ExperimentRun = {
  limit: number;
  dataCredits: number;
  tokens: number;
  spend: number;
  resolved: number;
};

export const tokenLimits = [500, 1000, 1500, 2000];
export const dataCreditLimits = [1, 3, 5];

export const productionExample: ExperimentRun = {
  limit: 1500,
  dataCredits: 3,
  tokens: 1250,
  spend: 0.15,
  resolved: 88,
};

// Spend is illustrative USD per lead, including data-provider and AI usage.
// Illustrative outcomes for the same 100 leads in every configuration.
export const experimentRuns: ExperimentRun[] = [
  { limit: 500, dataCredits: 1, tokens: 400, spend: 0.04, resolved: 76 },
  { limit: 500, dataCredits: 3, tokens: 450, spend: 0.06, resolved: 79 },
  { limit: 500, dataCredits: 5, tokens: 480, spend: 0.08, resolved: 80 },
  { limit: 1000, dataCredits: 1, tokens: 750, spend: 0.09, resolved: 69 },
  { limit: 1000, dataCredits: 3, tokens: 850, spend: 0.1, resolved: 82 },
  { limit: 1000, dataCredits: 5, tokens: 950, spend: 0.12, resolved: 85 },
  { limit: 1500, dataCredits: 1, tokens: 1100, spend: 0.11, resolved: 66 },
  productionExample,
  { limit: 1500, dataCredits: 5, tokens: 1400, spend: 0.18, resolved: 88 },
  { limit: 2000, dataCredits: 1, tokens: 1550, spend: 0.19, resolved: 85 },
  { limit: 2000, dataCredits: 3, tokens: 1700, spend: 0.23, resolved: 89 },
  { limit: 2000, dataCredits: 5, tokens: 1900, spend: 0.29, resolved: 90 },
];
