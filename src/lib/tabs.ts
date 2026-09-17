export function bindTabs({
  tabs,
  onSelect,
}: {
  tabs: HTMLButtonElement[];
  onSelect: (selection: { index: number; focus: boolean }) => void;
}) {
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => onSelect({ index, focus: false }));
    tab.addEventListener("keydown", (event) => {
      const offset =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (offset === 0 && event.key !== "Home" && event.key !== "End") return;

      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + offset + tabs.length) % tabs.length;
      onSelect({ index: nextIndex, focus: true });
    });
  });
}
