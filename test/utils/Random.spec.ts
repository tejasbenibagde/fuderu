import { afterEach, describe, expect, it, vi } from "vitest";

import { random, randomND, randomRound } from "../../src/utils";

describe("random", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the lower bound when Math.random returns 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(random(5, 10)).toBe(5);
  });

  it("returns a value between min and max", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    expect(random(10, 20)).toBe(15);
  });

  it("supports negative ranges", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.25);

    expect(random(-10, 10)).toBe(-5);
  });
});

describe("randomRound", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns min when min and max are equal", () => {
    expect(randomRound(4, 4)).toBe(4);
  });

  it("returns min when steps is zero or negative", () => {
    expect(randomRound(1, 10, 0)).toBe(1);
    expect(randomRound(1, 10, -2)).toBe(1);
  });

  it("snaps values to the configured step grid", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.51);

    expect(randomRound(0, 10, 10)).toBe(5);
  });

  it("clamps rounded values to the configured range", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);

    expect(randomRound(0, 10, 10)).toBe(10);
  });

  it("works with non-zero lower bounds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    expect(randomRound(5, 10, 10)).toBe(7.5);
  });
});

describe("randomND", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the mean when standard deviation is zero", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    expect(randomND(12, 0)).toBe(12);
  });

  it("uses Box-Muller output scaled by standard deviation", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(Math.exp(-0.5))
      .mockReturnValueOnce(0);

    expect(randomND(10, 2)).toBeCloseTo(12);
  });

  it("handles a zero first random sample without returning Infinity", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);

    expect(Number.isFinite(randomND(0, 1))).toBe(true);
  });
});
