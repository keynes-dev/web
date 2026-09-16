import {
  bounds,
  polygonPath,
  projectIndexed,
  spatialIndex,
  subtractTriangle,
  visibleSegments,
  segmentPath,
  transform,
} from "./projection.js";

export function translatedBoxCache() {
  const cache = new Map();
  return {
    clear() {
      cache.clear();
    },
    get(group, frame, offsetSurface) {
      const index = Number(group.binding.slice(4));
      const box = frame.boxes[index];
      if (Math.abs(Math.sin(box.roll)) > 1e-8) return null;
      const key = `${group.binding}:${Math.cos(box.roll) < 0 ? 1 : 0}`;
      if (!cache.has(key)) {
        const localFrame = {
          ...frame,
          boxes: frame.boxes.map((b, i) =>
            i === index ? { ...b, y: 0, z: 0 } : b,
          ),
        };
        const geometry = projectIndexed(group, localFrame);
        geometry.triangles = geometry.triangles.map(offsetSurface);
        const query = spatialIndex(geometry.triangles);
        geometry.lines = geometry.lines.flatMap((l) =>
          visibleSegments(l.a, l.b, query(bounds([l.a, l.b]))).map(
            ([a, b]) => ({ a, b, fine: l.fine }),
          ),
        );
        geometry.colors = [];
        for (const face of geometry.triangles) {
          if (face.color === "ground") continue;
          let fragments = [face.points];
          for (const other of query(face.bounds)) {
            if (other.color === face.color) continue;
            fragments = fragments.flatMap((p) =>
              subtractTriangle(p, other, face.plane),
            );
            if (!fragments.length) break;
          }
          geometry.colors.push(
            ...fragments.map((points) => ({
              ...face,
              points,
              bounds: bounds(points),
            })),
          );
        }
        geometry.origin = transform([0, 0, 0], group.binding, localFrame);
        geometry.ground = geometry.triangles
          .map((t) => polygonPath(t.points))
          .join("");
        geometry.ink = geometry.colors
          .filter((t) => t.color === "ink")
          .map((t) => polygonPath(t.points))
          .join("");
        geometry.strokes = [0, 1].map((fine) =>
          geometry.lines
            .filter((l) => l.fine === fine)
            .map((l) => segmentPath(l.a, l.b))
            .join(""),
        );
        cache.set(key, geometry);
      }
      const artwork = cache.get(key);
      const origin = transform([0, 0, 0], group.binding, frame);
      return { artwork, delta: origin.map((v, i) => v - artwork.origin[i]) };
    },
  };
}

export function translateBox({ artwork, delta }) {
  const point = (p) => p.map((v, i) => v + delta[i]);
  const rect = (b) => b.map((v, i) => v + delta[i % 2]);
  const face = (t) => ({
    ...t,
    points: t.points.map(point),
    bounds: rect(t.bounds),
    plane: [
      t.plane[0],
      t.plane[1],
      t.plane[2] + delta[2] - t.plane[0] * delta[0] - t.plane[1] * delta[1],
    ],
  });
  return {
    triangles: artwork.triangles.map(face),
    colors: artwork.colors.map(face),
    lines: artwork.lines.map((l) => ({ ...l, a: point(l.a), b: point(l.b) })),
  };
}

export function createBoxLayer(svg, groups) {
  const ns = "http://www.w3.org/2000/svg";
  const nodes = new Map(
    groups
      .filter((g) => g.binding.startsWith("box:"))
      .map((group) => {
        const node = document.createElementNS(ns, "g");
        node.setAttribute("data-box", group.binding);
        const paths = ["ground", "ink", "line", "fine"].map((kind) => {
          const p = document.createElementNS(ns, "path");
          p.setAttribute(
            "fill",
            kind === "ground"
              ? "var(--conveyor-ground, white)"
              : kind === "ink"
                ? "currentColor"
                : "none",
          );
          if (kind === "line" || kind === "fine") {
            p.setAttribute("stroke", "currentColor");
            p.setAttribute("stroke-linecap", "round");
            p.setAttribute("stroke-linejoin", "round");
          }
          node.append(p);
          return p;
        });
        svg.append(node);
        return [group.binding, { node, paths }];
      }),
  );
  return {
    draw(binding, cached) {
      const entry = nodes.get(binding);
      entry.node.setAttribute("display", cached ? "inline" : "none");
      if (!cached) return;
      const { artwork, delta } = cached;
      entry.node.setAttribute(
        "transform",
        `translate(${delta[0]} ${delta[1]})`,
      );
      if (entry.artwork === artwork) return;
      entry.artwork = artwork;
      [artwork.ground, artwork.ink, ...artwork.strokes].forEach((d, i) =>
        entry.paths[i].setAttribute("d", d),
      );
    },
    resize(line, fine) {
      for (const { paths } of nodes.values()) {
        paths[2].setAttribute("stroke-width", String(line));
        paths[3].setAttribute("stroke-width", String(fine));
      }
    },
  };
}
