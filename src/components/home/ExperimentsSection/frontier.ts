import { line, curveMonotoneX } from "d3-shape";

type FrontierPoint = {
  spend: number;
  resolved: number;
};

const VERTEX_TOKENS = 350;
const VERTEX_RESOLVED = 76;
const CURVE_C = 6.5;
const UPPER_RISE = 19;
const LOWER_DROP = 11;
const KNEE_TOKENS = 1250;

export const chartDomain = {
  spend: [0, 0.35],
  resolved: [50, 100],
};

export const xTicks = [0, 0.1, 0.2, 0.3];
export const yTicks = [50, 60, 70, 80, 90, 100];

function spendFor(offset: number) {
  return VERTEX_TOKENS + CURVE_C * offset * offset;
}

function upperAt(tokens: number) {
  if (tokens <= KNEE_TOKENS) {
    return (
      VERTEX_RESOLVED +
      12 * Math.sqrt((tokens - VERTEX_TOKENS) / (KNEE_TOKENS - VERTEX_TOKENS))
    );
  }

  return 88 + 2.2 * (1 - Math.exp(-(tokens - KNEE_TOKENS) / 300));
}

function curvePoints(span: number, direction: 1 | -1): FrontierPoint[] {
  return Array.from({ length: 101 }, (_, index) => {
    const offset = (span * index) / 100;
    const tokens = spendFor(offset);
    return {
      spend: tokens * 0.00012,
      resolved: direction === 1 ? upperAt(tokens) : VERTEX_RESOLVED - offset,
    };
  });
}

export const upperCurve = curvePoints(UPPER_RISE, 1);
export const lowerCurve = curvePoints(LOWER_DROP, -1);

export function pathFor(
  points: FrontierPoint[],
  x: (value: number) => number,
  y: (value: number) => number,
) {
  return line<FrontierPoint>()
    .x((point) => x(point.spend))
    .y((point) => y(point.resolved))
    .curve(curveMonotoneX)(points);
}
