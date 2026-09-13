export const tokenLimits = [500, 1000, 1500, 2000];
export const searchLimits = [1, 3, 5];

export const productionExample = {
  limit: 1500,
  searches: 3,
  tokens: 1250,
  resolved: 86,
};

// Illustrative outcomes for the same 100 support tickets in every configuration.
export const experimentRuns = [
  { limit: 500, searches: 1, tokens: 400, resolved: 55 },
  { limit: 500, searches: 3, tokens: 450, resolved: 62 },
  { limit: 500, searches: 5, tokens: 480, resolved: 64 },
  { limit: 1000, searches: 1, tokens: 750, resolved: 68 },
  { limit: 1000, searches: 3, tokens: 850, resolved: 78 },
  { limit: 1000, searches: 5, tokens: 950, resolved: 80 },
  { limit: 1500, searches: 1, tokens: 1100, resolved: 76 },
  productionExample,
  { limit: 1500, searches: 5, tokens: 1400, resolved: 87 },
  { limit: 2000, searches: 1, tokens: 1550, resolved: 82 },
  { limit: 2000, searches: 3, tokens: 1700, resolved: 89 },
  { limit: 2000, searches: 5, tokens: 1900, resolved: 90 },
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
