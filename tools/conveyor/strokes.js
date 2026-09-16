import { polygonPath, subtractTriangle } from "./projection.js";

// Clip the full stroke at moving intersections. Clipping only its centre line
// leaves a round end where depth clipping produces a tapered edge.
export function clippedStroke(a, b, width, occluders) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    length = Math.hypot(dx, dy);
  if (length < 1e-10) return "";
  const radius = width / 2,
    ux = dx / length,
    uy = dy / length;
  const nx = -uy * radius,
    ny = ux * radius;
  const slope = (b[2] - a[2]) / length;
  const plane = [
    slope * ux,
    slope * uy,
    a[2] - slope * (ux * a[0] + uy * a[1]),
  ];
  const pieces = [
    {
      plane,
      points: [
        [a[0] + nx, a[1] + ny, a[2]],
        [a[0] - nx, a[1] - ny, a[2]],
        [b[0] - nx, b[1] - ny, b[2]],
        [b[0] + nx, b[1] + ny, b[2]],
      ],
    },
  ];
  const angle = Math.atan2(dy, dx);
  for (const [center, start] of [
    [a, angle + Math.PI / 2],
    [b, angle - Math.PI / 2],
  ]) {
    const points = [center];
    for (let i = 0; i <= 16; i++) {
      const t = start + (i * Math.PI) / 16;
      points.push([
        center[0] + radius * Math.cos(t),
        center[1] + radius * Math.sin(t),
        center[2],
      ]);
    }
    pieces.push({ points, plane: [0, 0, center[2]] });
  }
  let path = "";
  for (const piece of pieces) {
    let fragments = [piece.points];
    for (const occluder of occluders) {
      fragments = fragments.flatMap((p) =>
        subtractTriangle(p, occluder, piece.plane),
      );
      if (!fragments.length) break;
    }
    path += fragments.map(polygonPath).join("");
  }
  return path;
}
