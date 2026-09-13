/** Illustrative data for the landing page's efficient frontier chart. */

export const VERTEX_T = 350;
export const VERTEX_Q = 76;
export const CURVE_C = 6.5;
export const UPPER_RISE = 18;
export const LOWER_DROP = 15;
export const T_MAX = 3_000;
export const KNEE_T = 1_200;
export const LOOSE_T = 1_600;

export function spendFor(offset: number): number {
  return VERTEX_T + CURVE_C * offset * offset;
}

export function offsetAt(tokens: number): number {
  return Math.sqrt((tokens - VERTEX_T) / CURVE_C);
}

export function upperAt(tokens: number): number {
  return VERTEX_Q + offsetAt(tokens);
}

export function lowerAt(tokens: number): number {
  return VERTEX_Q - offsetAt(tokens);
}

export interface FrontierPoint {
  tokens: number;
  resolved: number;
}

export interface FrontierSeries {
  upper: FrontierPoint[];
  lower: FrontierPoint[];
  measuredRuns: FrontierPoint[];
  knee: FrontierPoint;
  ungoverned: FrontierPoint;
}

function armPoints(span: number, sign: 1 | -1): FrontierPoint[] {
  const points: FrontierPoint[] = [];
  for (let i = 0; i <= 100; i++) {
    const v = (span * i) / 100;
    points.push({
      tokens: spendFor(v),
      resolved: VERTEX_Q + sign * v,
    });
  }
  return points;
}

const MEASURED_RUNS: [number, number][] = [
  [800, 82],
  [1_400, 86],
  [2_000, 90],
  [900, 69],
  [1_400, 65],
];

export function buildFrontierSeries(): FrontierSeries {
  return {
    upper: armPoints(UPPER_RISE, 1),
    lower: armPoints(LOWER_DROP, -1),
    measuredRuns: MEASURED_RUNS.map(([tokens, resolved]) => ({
      tokens,
      resolved,
    })),
    knee: { tokens: KNEE_T, resolved: upperAt(KNEE_T) },
    ungoverned: { tokens: LOOSE_T, resolved: lowerAt(LOOSE_T) },
  };
}
