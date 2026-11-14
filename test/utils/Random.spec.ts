import { afterEach, describe, expect, it, vi } from "vitest";
import { random, randomND, randomRound } from "../../src/utils";

describe("Random utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("random maps [0, 1) uniformly onto [min, max) including negative ranges", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.25);

    expect(random(5, 10)).toBe(5);
    expect(random(10, 20)).toBe(15);
    expect(random(-10, 10)).toBe(-5);
  });

  it("randomRound handles degenerate inputs, clamps, and snaps strictly to grid steps", () => {
    expect(randomRound(4, 4)).toBe(4);
    expect(randomRound(1, 10, 0)).toBe(1);
    expect(randomRound(1, 10, -2)).toBe(1);

    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.51)
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(0.5);

    expect(randomRound(0, 10, 10)).toBe(5);
    expect(randomRound(0, 10, 10)).toBe(10);
    expect(randomRound(5, 10, 10)).toBe(7.5);

    vi.restoreAllMocks();
    const validGrid = new Set([0, 2, 4, 6, 8, 10]);
    for (let i = 0; i < 40; i++) {
      expect(validGrid.has(randomRound(0, 10, 5))).toBe(true);
    }
  });

  it("randomND computes Box-Muller Gaussian samples and avoids Infinity when u1 is 0", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(Math.exp(-0.5))
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    expect(randomND(12, 0)).toBe(12);
    expect(randomND(10, 2)).toBeCloseTo(12);
    expect(Number.isFinite(randomND(0, 1))).toBe(true);
  });
});
