import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateRotation, lerpAngle } from "../../src/utils";

describe("lerpAngle", () => {
  it("interpolates directly and respects t=0 / t=1 boundaries", () => {
    expect(lerpAngle(0, Math.PI, 0.5)).toBeCloseTo(Math.PI / 2);
    expect(lerpAngle(1, 2, 0)).toBeCloseTo(1);
    expect(lerpAngle(1, 2, 1)).toBeCloseTo(2);
    expect(lerpAngle(-Math.PI / 2, Math.PI / 2, 0.5)).toBeCloseTo(0);
  });

  it("takes shortest arc across 0/2pi and -pi/pi seams", () => {
    // Near 0 / 2pi seam
    const seamResult = lerpAngle(Math.PI * 1.9, Math.PI * 0.1, 0.5);
    expect(seamResult).toBeCloseTo(Math.PI * 2);

    // Across -pi / +pi seam: +162deg to -162deg -> midpoint near +180deg (PI)
    const piSeamResult = lerpAngle(Math.PI * 0.9, -Math.PI * 0.9, 0.5);
    expect(Math.abs(piSeamResult)).toBeCloseTo(Math.PI);
  });
});

describe("calculateRotation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles fixed and omitted mode with optional offset", () => {
    expect(calculateRotation(0, 0, 50, 50)).toBe(0);
    expect(calculateRotation(0, 0, 50, 50, {})).toBe(0);
    expect(calculateRotation(0, 0, 50, 50, { mode: "fixed" })).toBe(0);
    expect(
      calculateRotation(0, 0, -50, 100, { mode: "fixed", offset: Math.PI / 4 }),
    ).toBeCloseTo(Math.PI / 4);
  });

  it("handles random mode with offset", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(
      calculateRotation(0, 0, 10, 10, { mode: "random", offset: 0 }),
    ).toBeCloseTo(Math.PI);
    expect(
      calculateRotation(0, 0, 10, 10, { mode: "random", offset: Math.PI / 2 }),
    ).toBeCloseTo(Math.PI * 1.5);
  });

  it("follows movement direction, applies offset/jitter, and smooths toward prevAngle", () => {
    expect(calculateRotation(0, 0, 10, 0, { mode: "flow" })).toBeCloseTo(0);
    expect(calculateRotation(0, 0, 0, 10, { mode: "flow" })).toBeCloseTo(
      Math.PI / 2,
    );
    expect(
      Math.abs(calculateRotation(0, 0, -10, 0, { mode: "flow" })),
    ).toBeCloseTo(Math.PI);
    expect(calculateRotation(0, 0, 0, -10, { mode: "flow" })).toBeCloseTo(
      -Math.PI / 2,
    );
    expect(
      calculateRotation(0, 0, 10, 0, { mode: "flow", offset: Math.PI / 4 }),
    ).toBeCloseTo(Math.PI / 4);

    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(1);
    expect(
      calculateRotation(0, 0, 10, 0, { mode: "flow", jitter: Math.PI }),
    ).toBeCloseTo(-Math.PI / 2);
    expect(
      calculateRotation(0, 0, 10, 0, { mode: "flow", jitter: Math.PI }),
    ).toBeCloseTo(Math.PI / 2);

    expect(
      calculateRotation(0, 0, 0, 10, { mode: "flow", smoothing: 0.5 }, 0),
    ).toBeCloseTo(Math.PI / 4);
    expect(
      calculateRotation(0, 0, 0, 10, { mode: "flow", smoothing: 1 }, 0),
    ).toBeCloseTo(Math.PI / 2);
    expect(
      calculateRotation(
        0,
        0,
        0,
        10,
        { mode: "flow", smoothing: 0 },
        Math.PI / 3,
      ),
    ).toBeCloseTo(Math.PI / 3);
  });
});
