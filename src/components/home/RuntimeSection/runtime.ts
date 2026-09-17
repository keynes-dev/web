import { bindTabs } from "@/lib/tabs";

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

  if (!demo || !controls || !tablist || !previous || !next || !tabs.length) {
    continue;
  }

  demo.dataset.enhanced = "";
  tablist.hidden = false;
  controls.hidden = false;

  const select = ({
    index,
    focus = false,
  }: {
    index: number;
    focus?: boolean;
  }) => {
    const selected = tabs[index];
    const selectedId = selected?.dataset.runtimeTab;
    if (!selected || !selectedId) return;

    descriptions.forEach((description) => {
      description.hidden = description.dataset.runtimeCopy !== selectedId;
    });
    previous.disabled = index === 0;
    next.disabled = index === tabs.length - 1;

    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.runtimePanel !== selectedId;
    });
  };

  bindTabs({ tabs, onSelect: select });
  previous.addEventListener("click", () => {
    const index = tabs.findIndex(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    select({ index: index - 1 });
  });
  next.addEventListener("click", () => {
    const index = tabs.findIndex(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    select({ index: index + 1 });
  });

  select({ index: 0 });
}
