type SyntaxSpan = Awaited<ReturnType<typeof import("gpu-lexer").parse>>[number];

const tokenClasses: Record<string, string> = {
  comment: "text-muted-foreground",
  string: "text-fuchsia-700",
  number: "text-amber-700",
  keyword: "text-red-700",
  type: "text-amber-700",
  function: "text-blue-700",
  constant: "text-blue-700",
  operator: "text-muted-foreground",
};

function renderTokens(code: HTMLElement, source: string, tokens: SyntaxSpan[]) {
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  for (const token of tokens) {
    if (
      token.start < cursor ||
      token.end < token.start ||
      token.end > source.length
    )
      continue;
    fragment.append(source.slice(cursor, token.start));
    const span = document.createElement("span");
    span.className = tokenClasses[token.type] ?? "";
    span.textContent = source.slice(token.start, token.end);
    fragment.append(span);
    cursor = token.end;
  }
  fragment.append(source.slice(cursor));
  code.replaceChildren(fragment);
}

export async function highlightRuntimeCode(root: HTMLElement) {
  const blocks = Array.from(
    root.querySelectorAll<HTMLElement>("[data-runtime-code]"),
  );
  if (!blocks.length || !("gpu" in navigator)) return;
  try {
    const { parse } = await import("gpu-lexer");
    for (const block of blocks) {
      const source = block.textContent ?? "";
      renderTokens(block, source, await parse(source));
    }
  } catch (error) {
    console.warn("Runtime code highlighting was unavailable.", error);
  }
}
