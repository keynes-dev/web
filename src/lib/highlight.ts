import { parse } from "gpu-lexer";

type SyntaxSpan = Awaited<ReturnType<typeof parse>>[number];

// Tuned for dark code panels (`bg-taupe-600` via CodeScrollArea).
const tokenClasses: Record<string, string> = {
  comment: "text-taupe-300",
  string: "text-fuchsia-300",
  number: "text-amber-300",
  keyword: "text-violet-300",
  type: "text-amber-300",
  function: "text-sky-300",
  constant: "text-sky-300",
  operator: "text-taupe-300",
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

// Highlights every `[data-code]` block in `root`, including blocks inside
// hidden tab panels so switching tabs never reveals unhighlighted code.
export async function highlightCode(root: ParentNode = document) {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-code]"));
  if (!blocks.length || !("gpu" in navigator)) return;
  try {
    for (const block of blocks) {
      const source = block.textContent ?? "";
      renderTokens(block, source, await parse(source));
    }
  } catch (error) {
    console.warn("Code highlighting was unavailable.", error);
  }
}
