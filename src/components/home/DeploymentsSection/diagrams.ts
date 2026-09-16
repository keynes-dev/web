import { baseRules, paintAscii, type Rule } from "./ascii";

const nameRule = (words: string[], cls = "c-dark"): Rule => ({
  re: new RegExp(`\\b(${words.join("|").replace(/ /g, "\\ ")})\\b`),
  cls,
});

const GLYPH_WIDTH = 36;

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
    "your postgresql",
    "transaction",
    "your app",
    "keynes",
  ]),
];

export const localGlyph = paintAscii(
  [...glyphBox("node process", ["", "  [ app ]  <------->  [ PGLite ]", ""])],
  glyphRules,
);

const transactionBox = (() => {
  const width = 30;
  const inner = width - 2;
  const title = "transaction";
  return [
    "+-- " + title + " " + "-".repeat(width - 6 - title.length) + "+",
    "|" + " [ your app ] [ keynes.* ]".padEnd(inner) + "|",
    "+" + "-".repeat(inner) + "+",
  ];
})();

export const embeddedGlyph = paintAscii(
  [
    ...glyphBox(
      "PostgreSQL DB",
      transactionBox.map((line) => "  " + line),
    ),
  ],
  glyphRules,
);

export const hostedGlyph = paintAscii(
  glyphBox("Keynes Cloud", [
    "             network",
    "               ||",
    "    [ app ] <--||--> [ Keynes ]",
    "               ||",
  ]),
  glyphRules,
);
