Astro owns the document shell and routing. Keep routes under `src/pages/` and
put page-specific React components in a shallow feature folder such as
`src/components/home/`. Keep reusable primitives in `src/components/ui/` and
shared site components at the root of `src/components/`.

Define global fonts, type scales, and element typography in `src/styles/global.css`.
Use `Section` for every page section. It owns the rails, crossing marks, inner
width, responsive padding, and border rhythm. Compose headings, eyebrows, and
descriptions directly in each section so their semantics, layout, and Tailwind
classes remain visible and independently customizable. Section implementations
must not recreate or override the shared frame.
Use `AccessLinks` for the shared homepage calls to action and `SiteLinks` for
site navigation.

Use the app-local shadcn components under `src/components/ui/`. Prefer the
shared `Section` and Card primitives over new page-specific wrappers. Keep the
full-bleed section border and the stepped Tailwind container layout.

Marketing charts use TanStack Charts through the shared chart helpers. Import
only the required chart and D3 modules. Keep the Budget and Policy figures
independent of the chart library. Do not reintroduce Recharts or ASCII chart
rendering.

Keep the `@/*` TypeScript and Vite aliases aligned. Hydrate interactive islands
with `client:load`; `client:visible` does not run when its wrapper has zero
layout size. Sections with no interactivity take no client directive at all.
Preserve the TypeScript source reload plugin in `astro.config.mjs`.

The conveyor drawing is the `<conveyor-belt>` custom element, defined by
`src/lib/conveyor/element.js` and registered by a `<script>` in the page that
uses it, so the section holding the tag needs no hydrating. Register it from
`BaseLayout` instead if a second page ever wants it. Declare custom elements in
`src/custom-elements.d.ts` for the TSX that uses them. Only one conveyor can be
drawn at a time — it keeps one camera and one set of materials — and
`createConveyor` throws on a second.

The drawing takes its three colours from the element's own computed style, so
give them to it as utilities: `text-*` is the ink, `bg-*` the ground (falling
back to `--card`), `border-*` the grid's rule. System theme changes are followed.
Tailwind only emits classes it finds in scanned source, so the utility has to be
written literally on the element rather than composed at runtime.

Run the web typecheck, production build, and desktop and mobile browser checks
for website changes. Treat browser inspection as part of the design process;
do not add automated tests for the website. Use a repository-supported Node.js
version.
