export class ConveyorBelt extends HTMLElement {
  #conveyor;
  #frame;
  // Ignore pending initialization after removal or reconnection.
  #connection;

  connectedCallback() {
    if (this.#conveyor || this.#connection) return;
    const connection = {};
    this.#connection = connection;
    const renderer = import.meta.env.DEV
      ? import("./svg-preview.js")
      : import("./main.js");
    void renderer.then(async ({ createConveyor, prepareConveyor }) => {
      const poster = this.querySelector("[data-conveyor-placeholder] img");
      await Promise.all([
        prepareConveyor?.(this),
        poster instanceof HTMLImageElement
          ? poster.decode().catch((error) => {
              console.warn("Conveyor placeholder could not be decoded", error);
            })
          : undefined,
      ]);
      if (this.#connection !== connection) return;
      // Let the server-rendered placeholder paint before scene preparation.
      this.#frame = requestAnimationFrame(() => {
        this.#frame = requestAnimationFrame(() => {
          this.#frame = undefined;
          if (this.#connection !== connection) return;
          this.#conveyor = createConveyor(this);
          this.setAttribute("data-ready", "");
        });
      });
    });
  }

  disconnectedCallback() {
    this.#connection = undefined;
    cancelAnimationFrame(this.#frame);
    this.#frame = undefined;
    this.#conveyor?.destroy();
    this.#conveyor = undefined;
    this.removeAttribute("data-ready");
  }
}

customElements.define("conveyor-belt", ConveyorBelt);
