// Runs before every test file.
import "@testing-library/jest-dom/vitest"; // adds checks like toBeInTheDocument()
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// A simple in-memory localStorage for tests.
// Why: newer Node versions (25+) have their own built-in `localStorage`,
// which is broken unless Node is started with --localstorage-file. It hides
// the simulated browser's working one, so we install our own instead.
class MemoryStorage {
  #items = new Map();

  get length() {
    return this.#items.size;
  }
  key(index) {
    return [...this.#items.keys()][index] ?? null;
  }
  getItem(key) {
    return this.#items.has(String(key)) ? this.#items.get(String(key)) : null;
  }
  setItem(key, value) {
    this.#items.set(String(key), String(value));
  }
  removeItem(key) {
    this.#items.delete(String(key));
  }
  clear() {
    this.#items.clear();
  }
}

const storage = new MemoryStorage();
for (const target of new Set([globalThis, globalThis.window].filter(Boolean))) {
  Object.defineProperty(target, "localStorage", { value: storage, configurable: true, writable: true });
}

afterEach(() => {
  cleanup();            // remove what the test rendered
  localStorage.clear(); // start every test logged out
});

// jsdom (the simulated browser) doesn't implement scrolling.
Element.prototype.scrollIntoView = () => {};
