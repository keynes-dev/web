export const tokenLimits = [500, 1000, 1500, 2000];
export const dataCreditLimits = [1, 3, 5];

export const productionExample = {
  limit: 1500,
  dataCredits: 3,
  tokens: 1250,
  resolved: 88,
};

// Illustrative outcomes for the same 100 leads in every configuration.
export const experimentRuns = [
  { limit: 500, dataCredits: 1, tokens: 400, resolved: 76 },
  { limit: 500, dataCredits: 3, tokens: 450, resolved: 79 },
  { limit: 500, dataCredits: 5, tokens: 480, resolved: 80 },
  { limit: 1000, dataCredits: 1, tokens: 750, resolved: 69 },
  { limit: 1000, dataCredits: 3, tokens: 850, resolved: 82 },
  { limit: 1000, dataCredits: 5, tokens: 950, resolved: 85 },
  { limit: 1500, dataCredits: 1, tokens: 1100, resolved: 66 },
  productionExample,
  { limit: 1500, dataCredits: 5, tokens: 1400, resolved: 88 },
  { limit: 2000, dataCredits: 1, tokens: 1550, resolved: 85 },
  { limit: 2000, dataCredits: 3, tokens: 1700, resolved: 89 },
  { limit: 2000, dataCredits: 5, tokens: 1900, resolved: 90 },
];

export const frontierRuns = experimentRuns
  .filter(
    (candidate) =>
      !experimentRuns.some(
        (other) =>
          other.tokens <= candidate.tokens &&
          other.resolved >= candidate.resolved &&
          (other.tokens < candidate.tokens ||
            other.resolved > candidate.resolved),
      ),
  )
  .toSorted((a, b) => a.tokens - b.tokens);
