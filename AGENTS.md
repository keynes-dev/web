Astro owns the document shell and routing. Keep routes under `src/pages/` and
page components under `src/components/home/`. Name component folders after their
main component, such as `RuntimeSection/RuntimeSection.astro`. Components use
PascalCase; supporting modules use lowercase or kebab-case. Keep data, styles,
and scripts beside their component. Leave only site-wide helpers in `src/lib/`.

Define global fonts, theme colors, and element typography in `src/styles/global.css`.
Prefer standard Tailwind utilities over arbitrary values. Keep numeric values
where they describe SVG geometry, dynamic proportions, or precise rail alignment.
Use one `Section.astro` for page rails and responsive padding. Its default slot
holds padded content; `full-bleed` holds edge-to-edge content below it; `decoration`
holds positioned artwork. Header and footer use native semantic elements with
matching rail classes and shared `GridMarks.astro`.

Compose `Card.astro`, `CardHeader.astro`, `CardTitle.astro`, `CardContent.astro`,
and `CardFooter.astro` for standardized cards. Compose `Badge.astro` for compact
status labels. Each part accepts native HTML attributes and merges Tailwind
`class` overrides with its defaults. Do not add single-use card wrappers. Render shared navigation and access-link data
at their call sites so each caller controls styling.

Render charts as build-time SVG. Keep chart data and D3 curve generation beside
the experiment section. Preserve visible axes, card-owned padding, footer legends,
and accessible descriptions and values. Do not hydrate charts.

Render code as plain text at build time. GPU Lexer enhances it in the browser
when WebGPU is available; preserve readable plain code when it is not. Keep
source strings, highlighting, and tab behavior beside RuntimeSection. Use small
Astro-processed scripts for interactions, with readable no-JavaScript content.
The mobile navigation uses a native modal dialog with Escape dismissal, focus
restoration, scroll locking, and breakpoint handling. Keep aliases aligned.

The conveyor is the `<conveyor-belt>` custom element in
`src/components/home/HeroSection/conveyor/element.js`, registered by HeroSection.
Only one conveyor can be drawn at a time because it shares a camera and materials.
Keep its dynamic import and disconnect cleanup. The drawing takes its colors from
the element's computed style: text is ink, background is ground with a card-color
fallback, and border is the grid rule. Write Tailwind utilities literally so they
are included in the build. The site is light-only.

Run the web typecheck, production build, and desktop and mobile browser checks.
Check keyboard interaction and content without JavaScript. Do not add a website
unit-test suite. Use a repository-supported Node.js version.
