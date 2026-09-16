import { bounds, segmentPath, visibleSegments } from "./projection.js";

// Keep adjacent source lines together so partitioning preserves drawing order.
export function stationaryStrokes(hosts, lines, inView) {
  const batches = [];
  for (const [fine, host] of hosts.entries()) {
    host.replaceChildren();
    const visible = lines.filter(
      (line) => Number(line.fine) === fine && inView(line.bounds),
    );
    for (let i = 0; i < visible.length; i += 128) {
      const members = visible.slice(i, i + 128);
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      host.append(path);
      batches.push({
        members,
        path,
        bounds: bounds(members.flatMap((line) => [line.a, line.b])),
      });
    }
  }
  return {
    draw(dependencies, query) {
      for (const batch of batches) {
        const dependency = dependencies(batch.bounds);
        if (batch.dependency === dependency) continue;
        let output = "";
        for (const line of batch.members) {
          const dependency = dependencies(line.bounds);
          if (line.output?.dependency !== dependency) {
            const occluders = query(line.bounds);
            const path = occluders.length
              ? visibleSegments(line.a, line.b, occluders)
                  .map(([a, b]) => segmentPath(a, b))
                  .join("")
              : segmentPath(line.a, line.b);
            line.output = { dependency, path };
          }
          output += line.output.path;
        }
        if (batch.output !== output) batch.path.setAttribute("d", output);
        batch.output = output;
        batch.dependency = dependency;
      }
    },
  };
}
