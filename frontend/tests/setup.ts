import "@testing-library/jest-dom";
import React from "react";
import type { ReactNode } from "react";

/**
 * Global Jest setup for frontend tests.
 * - Adds Testing Library DOM matchers.
 * - Mocks browser APIs commonly missing in jsdom.
 */

// Mock matchMedia (used by responsive logic / UI libs)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList,
});

// Mock ResizeObserver (used by layout-dependent components)
class ResizeObserverMock implements ResizeObserver {
  observe(...args: Parameters<ResizeObserver["observe"]>): void {
    void args;
  }
  unobserve(...args: Parameters<ResizeObserver["unobserve"]>): void {
    void args;
  }
  disconnect(): void {}
}

(
  globalThis as typeof globalThis & { ResizeObserver: typeof ResizeObserver }
).ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// --- framer-motion test stubs ---
// Goal: preserve DOM semantics (e.g. motion.tr => <tr>, motion.tbody => <tbody>)
type MotionStubProps = {
  children?: ReactNode;
} & Record<string, unknown>;

const MOTION_PROPS_TO_STRIP = new Set([
  "animate",
  "initial",
  "exit",
  "variants",
  "transition",
  "layout",
  "layoutId",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "onAnimationStart",
  "onAnimationComplete",
  "viewport",
]);

function sanitizeMotionProps(props: MotionStubProps): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (MOTION_PROPS_TO_STRIP.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

function makeMotionTag(tag: keyof JSX.IntrinsicElements) {
  const Component = React.forwardRef<HTMLElement, MotionStubProps>(
    ({ children, ...props }, ref) => {
      const safeProps = sanitizeMotionProps(props);
      return React.createElement(
        tag,
        { ref, ...safeProps },
        children as ReactNode,
      );
    },
  );
  Component.displayName = `MotionStub(${tag})`;
  return Component;
}

jest.mock("framer-motion", () => {
  const cache = new Map<
    string | symbol,
    React.ComponentType<MotionStubProps>
  >();

  const motion = new Proxy(
    {},
    {
      get: (_target, prop: string | symbol) => {
        if (!cache.has(prop)) {
          const tag =
            typeof prop === "string" && prop.length > 0 && prop !== "default"
              ? (prop as keyof JSX.IntrinsicElements)
              : "div";
          cache.set(prop, makeMotionTag(tag));
        }
        return cache.get(prop);
      },
    },
  );

  return {
    __esModule: true,
    AnimatePresence: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion,
  };
});
