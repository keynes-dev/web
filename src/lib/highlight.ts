type TokenType =
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "type"
  | "function"
  | "constant"
  | "operator";

interface SyntaxSpan {
  type: TokenType | "plain";
  start: number;
  end: number;
}

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

const keywordPattern =
  /^(?:as|async|await|break|case|catch|class|const|continue|cross|default|delete|else|end|export|false|from|function|if|import|in|insert|join|let|new|null|of|return|select|then|true|type|typeof|using|var|when|with)\b/i;

function parseCpu(source: string): SyntaxSpan[] {
  const tokens: SyntaxSpan[] = [];
  const { length } = source;
  let index = 0;

  const push = (type: TokenType, start: number, end: number) => {
    if (end > start) tokens.push({ type, start, end });
  };

  while (index < length) {
    const start = index;
    const char = source[index]!;
    const next = source[index + 1];

    if (char === "/" && next === "/") {
      const newline = source.indexOf("\n", index);
      index = newline < 0 ? length : newline;
      push("comment", start, index);
      continue;
    }
    if (char === "/" && next === "*") {
      const close = source.indexOf("*/", index + 2);
      index = close < 0 ? length : close + 2;
      push("comment", start, index);
      continue;
    }
    if (
      char === "-" &&
      next === "-" &&
      (start === 0 || source[start - 1] === " " || source[start - 1] === "\n")
    ) {
      const newline = source.indexOf("\n", index);
      index = newline < 0 ? length : newline;
      push("comment", start, index);
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      index += 1;
      while (index < length) {
        if (source[index] === "\\") {
          index += 2;
          continue;
        }
        if (source[index] === char) {
          index += 1;
          break;
        }
        index += 1;
      }
      push("string", start, index);
      continue;
    }
    if (char >= "0" && char <= "9") {
      index += 1;
      while (index < length) {
        const digit = source[index]!;
        if ((digit >= "0" && digit <= "9") || digit === "_") index += 1;
        else break;
      }
      push("number", start, index);
      continue;
    }
    if (
      (char >= "A" && char <= "Z") ||
      (char >= "a" && char <= "z") ||
      char === "_" ||
      char === "$"
    ) {
      index += 1;
      while (index < length) {
        const letter = source[index]!;
        if (
          (letter >= "A" && letter <= "Z") ||
          (letter >= "a" && letter <= "z") ||
          (letter >= "0" && letter <= "9") ||
          letter === "_" ||
          letter === "$"
        )
          index += 1;
        else break;
      }
      const text = source.slice(start, index);
      let look = index;
      while (look < length && (source[look] === " " || source[look] === "\t"))
        look += 1;
      if (source[look] === "(") push("function", start, index);
      else if (keywordPattern.test(text)) push("keyword", start, index);
      else if (char >= "A" && char <= "Z") push("type", start, index);
      continue;
    }
    if ("=<>!&|+-*/%?:".includes(char)) {
      index += 1;
      while (index < length && "=<>&|+-".includes(source[index]!)) index += 1;
      push("operator", start, index);
      continue;
    }
    index += 1;
  }

  return tokens;
}

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

async function tokenize(source: string) {
  if ("gpu" in navigator && navigator.gpu) {
    try {
      const { parse } = await import("gpu-lexer");
      return await parse(source);
    } catch (error) {
      console.warn("GPU highlighting was unavailable.", error);
    }
  }
  return parseCpu(source);
}

// Highlights every `[data-code]` block in `root`, including blocks inside
// hidden tab panels so switching tabs never reveals unhighlighted code.
export async function highlightCode(root: ParentNode = document) {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-code]"));
  if (!blocks.length) return;
  try {
    for (const block of blocks) {
      const source = block.textContent ?? "";
      renderTokens(block, source, await tokenize(source));
    }
  } catch (error) {
    console.warn("Code highlighting was unavailable.", error);
  }
}
