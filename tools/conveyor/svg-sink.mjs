// This sink exercises geometry and SVG writes; it does not emulate browser paint.
export class Element {
  attributes = new Map();
  children = [];
  style = { setProperty: (key, value) => this.attributes.set(key, value) };
  setAttribute(key, value) {
    this.attributes.set(key, value);
  }
  getAttribute(key) {
    return this.attributes.get(key);
  }
  append(child) {
    this.children.push(child);
  }
  replaceChildren(...children) {
    this.children = children;
  }
  remove() {}
}

export function installSvgSink() {
  const observers = new Set();
  globalThis.document = { createElementNS: () => new Element() };
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      observers.add(this.callback);
    }
    disconnect() {
      observers.delete(this.callback);
    }
  };
  return () => {
    for (const callback of observers) callback();
  };
}
