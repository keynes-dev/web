import "@testing-library/jest-dom/vitest";

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { HeroDiagram } from "./HeroDiagram";

function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

function advanceFrame(durationMs: number): void {
  act(() => {
    vi.advanceTimersByTime(durationMs);
  });
}

function resourceChart(): HTMLElement {
  return screen.getByRole("img", { name: /budget resources:/i });
}

function expectIndicatorPosition(position: "app" | "transit" | "keynes"): void {
  const indicators = document.querySelectorAll(".step-indicator");
  expect(indicators).toHaveLength(2);
  for (const indicator of indicators) {
    expect(indicator).toHaveAttribute("data-indicator-position", position);
    expect(
      indicator.querySelectorAll(".journey-step-fill.is-active"),
    ).toHaveLength(1);
  }
}

describe("HeroDiagram", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubReducedMotion(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("passes through transit before moving from the app to Keynes", () => {
    render(<HeroDiagram />);

    expectIndicatorPosition("app");
    advanceFrame(700);
    expectIndicatorPosition("transit");
    advanceFrame(700);
    expectIndicatorPosition("keynes");
    advanceFrame(800);
    expectIndicatorPosition("transit");
    advanceFrame(700);
    expectIndicatorPosition("app");
  });

  test("keeps one request, decision, and resource story in sync", () => {
    render(<HeroDiagram />);

    expect(
      screen.getByRole("heading", { name: "Agents ask before they act." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/your app sends keynes a request/i)).toBeVisible();
    expect(screen.getByText("4_000", { exact: false })).toBeInTheDocument();
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 0 used, 0 reserved, 10 available/i,
    );
    expect(screen.queryByText("[✓] APPROVED")).not.toBeInTheDocument();
    expect(screen.queryByText("[x] DENIED")).not.toBeInTheDocument();
    for (const card of document.querySelectorAll('[data-slot="card"]')) {
      expect(card).toHaveClass("h-[25rem]");
    }

    advanceFrame(700);
    expectIndicatorPosition("transit");
    for (const indicator of document.querySelectorAll(".step-indicator")) {
      expect(indicator).toHaveClass("step-indicator");
      expect(indicator.querySelectorAll("[data-journey-step]")).toHaveLength(3);
      expect(indicator.querySelector("img")).toHaveAttribute(
        "src",
        "/indicator.svg",
      );
      expect(indicator.querySelector("path")).not.toBeInTheDocument();
      expect(indicator.querySelector("animateMotion")).not.toBeInTheDocument();
    }

    advanceFrame(700);
    expectIndicatorPosition("keynes");
    expect(screen.queryByText("[✓] APPROVED")).not.toBeInTheDocument();
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 0 used, 4 reserved, 6 available/i,
    );

    advanceFrame(800);
    expectIndicatorPosition("transit");
    expect(screen.queryByText("[✓] APPROVED")).not.toBeInTheDocument();
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 0 used, 4 reserved, 6 available/i,
    );

    advanceFrame(700);
    expectIndicatorPosition("app");
    expect(screen.getByText("[✓] APPROVED")).toBeVisible();

    advanceFrame(1_300);
    expectIndicatorPosition("app");

    advanceFrame(800);
    expectIndicatorPosition("transit");

    advanceFrame(700);
    expectIndicatorPosition("keynes");
    expect(screen.queryByText("[✓] APPROVED")).not.toBeInTheDocument();
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 3 used, 0 reserved, 7 available/i,
    );

    advanceFrame(900);
    expectIndicatorPosition("transit");
    expect(screen.queryByText("[✓] APPROVED")).not.toBeInTheDocument();

    advanceFrame(600);
    expectIndicatorPosition("app");
    expect(screen.getByText("6_000", { exact: false })).toBeInTheDocument();

    advanceFrame(800);
    expectIndicatorPosition("transit");

    advanceFrame(700);
    expectIndicatorPosition("keynes");
    expect(screen.queryByText("[x] DENIED")).not.toBeInTheDocument();

    advanceFrame(800);
    expectIndicatorPosition("transit");
    expect(screen.queryByText("[x] DENIED")).not.toBeInTheDocument();

    advanceFrame(700);
    expectIndicatorPosition("app");
    expect(screen.getByText("[x] DENIED")).toBeVisible();
    expect(screen.getByText(/policy_ceiling/)).toBeInTheDocument();
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
    expect(screen.getByText(/7,000/)).toBeInTheDocument();
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 3 used, 0 reserved, 7 available/i,
    );

    advanceFrame(1_500);
    expect(screen.getByText("5_000", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("[x] DENIED")).not.toBeInTheDocument();
    expectIndicatorPosition("app");

    advanceFrame(800);
    expectIndicatorPosition("transit");

    advanceFrame(700);
    expectIndicatorPosition("keynes");
    expect(screen.queryByText("[✓] APPROVED")).not.toBeInTheDocument();
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 3 used, 5 reserved, 2 available/i,
    );

    advanceFrame(800);
    expectIndicatorPosition("transit");
    expect(screen.queryByText("[✓] APPROVED")).not.toBeInTheDocument();
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 3 used, 5 reserved, 2 available/i,
    );

    advanceFrame(700);
    expectIndicatorPosition("app");
    expect(screen.getByText("[✓] APPROVED")).toBeVisible();

    advanceFrame(1_800);
    expect(screen.getByTestId("hero-flow")).toHaveAttribute(
      "data-resetting",
      "true",
    );

    advanceFrame(300);
    expect(screen.getByText("4_000", { exact: false })).toBeInTheDocument();
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 0 used, 0 reserved, 10 available/i,
    );
    expectIndicatorPosition("app");
  });

  test("shows the denied example without autoplay for reduced motion", () => {
    stubReducedMotion(true);
    render(<HeroDiagram />);

    expect(screen.getByText("[x] DENIED")).toBeVisible();
    expect(screen.getByText("6_000", { exact: false })).toBeInTheDocument();
    expectIndicatorPosition("app");
    expect(resourceChart()).toHaveAccessibleName(
      /tokens 3 used, 0 reserved, 7 available/i,
    );

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("[x] DENIED")).toBeVisible();
    expect(screen.getByText("6_000", { exact: false })).toBeInTheDocument();
  });

  test("keeps code panes static without highlighting or scrolling", () => {
    render(<HeroDiagram />);
    const application = screen.getByLabelText("Application code");
    const policy = screen.getByLabelText("Policy code");

    expect(application).not.toHaveAttribute("data-active-lines");
    expect(policy).not.toHaveAttribute("data-active-lines");
    expect(application).not.toHaveClass("overflow-y-scroll");
    expect(policy).not.toHaveClass("overflow-y-scroll");
    expect(document.querySelector(".code-line")).not.toBeInTheDocument();

    advanceFrame(700);
    advanceFrame(700);
    advanceFrame(800);
    advanceFrame(700);

    expect(application).not.toHaveAttribute("data-active-lines");
    expect(policy).not.toHaveAttribute("data-active-lines");
    expect(document.querySelector(".code-line")).not.toBeInTheDocument();
  });
});
