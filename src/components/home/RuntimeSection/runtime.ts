import { runtimeTabs } from "./tabs";

for (const section of document.querySelectorAll<HTMLElement>(
  "[data-runtime-section]",
)) {
  const demo = section.querySelector<HTMLElement>("[data-runtime-demo]");
  const descriptions = Array.from(
    section.querySelectorAll<HTMLElement>("[data-runtime-copy]"),
  );
  const controls = section.querySelector<HTMLElement>(
    "[data-runtime-controls]",
  );
  const tablist = section.querySelector<HTMLElement>("[data-runtime-tablist]");
  const previous = section.querySelector<HTMLButtonElement>(
    "[data-runtime-previous]",
  );
  const next = section.querySelector<HTMLButtonElement>("[data-runtime-next]");
  const tabs = Array.from(
    section.querySelectorAll<HTMLButtonElement>("[data-runtime-tab]"),
  );
  const panels = Array.from(
    section.querySelectorAll<HTMLElement>("[data-runtime-panel]"),
  );

  if (!demo || !controls || !tablist || !previous || !next) continue;

  // The tab bar attaches directly to the active panel once it is interactive,
  // so the stacked-panel gap of the no-JavaScript fallback is dropped.
  demo.classList.add("h-132");
  demo.classList.remove("gap-4");
  tablist.hidden = false;
  tablist.classList.add("flex");
  controls.hidden = false;
  panels.forEach((panel) => {
    panel.classList.add("min-h-0", "flex-1");
  });

  const select = (index: number, focus = false) => {
    const selected = runtimeTabs[index];
    if (!selected) return;

    descriptions.forEach((description) => {
      description.hidden = description.dataset.runtimeCopy !== selected.id;
    });
    previous.disabled = index === 0;
    next.disabled = index === runtimeTabs.length - 1;

    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.runtimePanel !== selected.id;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      const offset =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (offset === 0 && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? runtimeTabs.length - 1
            : (index + offset + runtimeTabs.length) % runtimeTabs.length;
      select(nextIndex, true);
    });
  });
  previous.addEventListener("click", () => {
    const index = tabs.findIndex(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    select(index - 1);
  });
  next.addEventListener("click", () => {
    const index = tabs.findIndex(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    select(index + 1);
  });

  select(0);
}
