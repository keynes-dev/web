/*
  HeroSection registers this element in an Astro script. Load the drawing only
  when connected, and destroy it on disconnect. The connection token prevents
  an import that resolves after disconnect from creating an orphaned drawing.
*/
export class ConveyorBelt extends HTMLElement {
  #conveyor;
  // Which connection a pending import belongs to. `disconnectedCallback` runs
  // synchronously inside `removeChild`, so an import can always still be in
  // flight when the element is taken out — and unlike a React effect the same
  // element can be put straight back, leaving two imports racing. A flag reset
  // on connect would let the stale one win; a token it can compare itself
  // against cannot be mistaken for the live one.
  #connection;

  connectedCallback() {
    if (this.#conveyor || this.#connection) return;
    const connection = {};
    this.#connection = connection;
    const renderer = import.meta.env.DEV
      ? import("./svg-preview.js")
      : import("./main.js");
    void renderer.then(({ createConveyor }) => {
      if (this.#connection !== connection) return;
      this.#conveyor = createConveyor(this);
    });
  }

  disconnectedCallback() {
    this.#connection = undefined;
    this.#conveyor?.destroy();
    this.#conveyor = undefined;
  }
}

customElements.define("conveyor-belt", ConveyorBelt);
