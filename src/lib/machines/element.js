export class KeynesMachine extends HTMLElement {
  #connection;
  #drawing;

  connectedCallback() {
    if (this.#connection) return;
    const connection = {};
    this.#connection = connection;
    void import("./main.js")
      .then(({ mountMachine }) => {
        if (this.#connection !== connection) return;
        this.#drawing = mountMachine(this);
        this.dataset.ready = "true";
      })
      .catch((error) => {
        if (this.#connection !== connection) return;
        this.querySelector("[data-phase]").textContent =
          "The drawing could not load. Reload to retry.";
        this.dataset.ready = "error";
        reportError(error);
      });
  }

  disconnectedCallback() {
    this.#connection = undefined;
    this.#drawing?.destroy();
    this.#drawing = undefined;
    delete this.dataset.ready;
  }
}

customElements.define("keynes-machine", KeynesMachine);
