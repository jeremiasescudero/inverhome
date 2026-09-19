import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/dom'

// Below vitest's testTimeout, so a missing element reports as such instead of
// surfacing as an opaque test timeout.
configure({ asyncUtilTimeout: 10000 })

// jsdom has no layout engine; recharts' ResponsiveContainer needs these to mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
