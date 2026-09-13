import { baseRules, paintAscii, type Rule } from "./ascii";

const nameRule = (words: string[], cls = "c-dark"): Rule => ({
  re: new RegExp(`\\b(${words.join("|").replace(/ /g, "\\ ")})\\b`),
  cls,
});

const GLYPH_WIDTH = 44;

function glyphBox(title: string, body: string[]): string[] {
  const inner = GLYPH_WIDTH - 2;
  return [
    "+-- " + title + " " + "-".repeat(GLYPH_WIDTH - 6 - title.length) + "+",
    ...body.map((line) => "|" + line.padEnd(inner).substring(0, inner) + "|"),
    "+" + "-".repeat(inner) + "+",
  ];
}

const glyphRules: Rule[] = [
  ...baseRules,
  { re: /\[ [^\]]+ \]/, cls: "c-dark" },
  { re: /keynes\.\*/, cls: "c-green" },
  { re: /network/, cls: "c-muted" },
  nameRule([
    "node process",
    "your postgresql 18.6",
    "one transaction",
    "your app",
    "keynes",
  ]),
];

export const localGlyph = paintAscii(
  [...glyphBox("node process", ["", "   [ app ]  <------->  [ sqlite ]", ""])],
  glyphRules,
);

const transactionBox = (() => {
  const inner = 38 - 2;
  const title = "one transaction";
  return [
    "+-- " + title + " " + "-".repeat(38 - 6 - title.length) + "+",
    "|" + "  [ your row ]      [ keynes.* ]".padEnd(inner) + "|",
    "+" + "-".repeat(inner) + "+",
  ];
})();

export const embeddedGlyph = paintAscii(
  [
    ...glyphBox(
      "your postgresql 18.6",
      transactionBox.map((line) => "  " + line),
    ),
  ],
  glyphRules,
);

export const hostedGlyph = paintAscii(
  [
    "+-- your app ------+  network  +-- keynes -+",
    "|                  |     :     |  service  |",
    "|   remote sdk     |-----:---->|  postgres |",
    "|                  |     :     |           |",
    "+------------------+     :     +-----------+",
  ],
  glyphRules,
);
