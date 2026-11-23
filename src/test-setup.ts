import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { LANGUAGE_STORAGE_KEY } from "./i18n";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
});

Object.defineProperty(globalThis, "ResizeObserver", {
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
Element.prototype.scrollIntoView = function () {};
