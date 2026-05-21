import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { lerpAngle, calculateRotation } from "../../src/utils/"
import type { RotationOptions } from "../../src/utils/";

// ─────────────────────────────────────────────
// lerpAngle
// ─────────────────────────────────────────────
describe("lerpAngle", () => {
    it("interpolates halfway between two angles", () => {
        const result = lerpAngle(0, Math.PI, 0.5);
        expect(result).toBeCloseTo(Math.PI / 2);
    });

    it("returns `a` when t = 0", () => {
        expect(lerpAngle(1, 2, 0)).toBeCloseTo(1);
    });

    it("returns `b` when t = 1", () => {
        expect(lerpAngle(1, 2, 1)).toBeCloseTo(2);
    });

    it("takes the short path across the 0 / 2π boundary (wrap-around)", () => {
        // Going from just-below 2π to just-above 0 should interpolate
        // through 0 (short path), not through π (long path)
        const a = Math.PI * 1.9;   // ~342°
        const b = Math.PI * 0.1;   // ~18°
        const result = lerpAngle(a, b, 0.5);
        // Short-path midpoint sits near 0 (360°/0°), not near 180°
        const distToZero = Math.abs(result % (Math.PI * 2));
        const distToPI = Math.abs(result - Math.PI);
        expect(distToZero).toBeLessThan(distToPI);
    });

    it("handles negative angles without leaving the expected range", () => {
        const result = lerpAngle(-Math.PI / 2, Math.PI / 2, 0.5);
        expect(result).toBeCloseTo(0);
    });
});

// ─────────────────────────────────────────────
// calculateRotation — fixed mode
// ─────────────────────────────────────────────
describe("calculateRotation — fixed mode", () => {
    it("returns 0 by default (no options)", () => {
        expect(calculateRotation(0, 0, 10, 10)).toBeCloseTo(0);
    });

    it("returns the offset value when mode is fixed", () => {
        const options: RotationOptions = { mode: "fixed", offset: Math.PI / 4 };
        const result = calculateRotation(0, 0, 100, 100, options);
        expect(result).toBeCloseTo(Math.PI / 4);
    });

    it("ignores movement direction entirely in fixed mode", () => {
        const options: RotationOptions = { mode: "fixed", offset: 1 };
        const r1 = calculateRotation(0, 0, 100, 0, options); // moving right
        const r2 = calculateRotation(0, 0, 0, 100, options); // moving down
        const r3 = calculateRotation(0, 0, -50, -50, options); // moving up-left
        expect(r1).toBeCloseTo(1);
        expect(r2).toBeCloseTo(1);
        expect(r3).toBeCloseTo(1);
    });

    it("returns 0 when mode is fixed and offset is omitted", () => {
        const result = calculateRotation(0, 0, 50, 50, { mode: "fixed" });
        expect(result).toBeCloseTo(0);
    });
});

// ─────────────────────────────────────────────
// calculateRotation — random mode
// ─────────────────────────────────────────────
describe("calculateRotation — random mode", () => {
    beforeEach(() => {
        vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("uses Math.random (mocked to 0.5) → result is π + offset", () => {
        const options: RotationOptions = { mode: "random", offset: 0 };
        // random() = 0.5  →  0.5 * 2π = π
        const result = calculateRotation(0, 0, 10, 10, options);
        expect(result).toBeCloseTo(Math.PI);
    });

    it("adds offset on top of the random angle", () => {
        const options: RotationOptions = { mode: "random", offset: Math.PI / 2 };
        // random() = 0.5  →  π + π/2 = 3π/2
        const result = calculateRotation(0, 0, 10, 10, options);
        expect(result).toBeCloseTo(Math.PI + Math.PI / 2);
    });

    it("produces a different value each call without mocking", () => {
        vi.restoreAllMocks(); // use real Math.random for this test
        const options: RotationOptions = { mode: "random" };
        const results = new Set(
            Array.from({ length: 20 }, () =>
                calculateRotation(0, 0, 10, 10, options)
            )
        );
        // With 20 calls, it's astronomically unlikely all values are identical
        expect(results.size).toBeGreaterThan(1);
    });
});

// ─────────────────────────────────────────────
// calculateRotation — flow mode
// ─────────────────────────────────────────────
describe("calculateRotation — flow mode", () => {
    it("follows the movement direction (moving right → angle ≈ 0)", () => {
        const options: RotationOptions = { mode: "flow" };
        const result = calculateRotation(0, 0, 10, 0, options);
        expect(result).toBeCloseTo(0);
    });

    it("follows the movement direction (moving down → angle ≈ π/2)", () => {
        const options: RotationOptions = { mode: "flow" };
        const result = calculateRotation(0, 0, 0, 10, options);
        expect(result).toBeCloseTo(Math.PI / 2);
    });

    it("follows the movement direction (moving left → angle ≈ ±π)", () => {
        const options: RotationOptions = { mode: "flow" };
        const result = calculateRotation(0, 0, -10, 0, options);
        expect(Math.abs(result)).toBeCloseTo(Math.PI);
    });

    it("follows the movement direction (moving up → angle ≈ -π/2)", () => {
        const options: RotationOptions = { mode: "flow" };
        const result = calculateRotation(0, 0, 0, -10, options);
        expect(result).toBeCloseTo(-Math.PI / 2);
    });

    it("adds offset on top of the flow angle", () => {
        const options: RotationOptions = { mode: "flow", offset: Math.PI / 4 };
        // Moving right: base = 0, + π/4
        const result = calculateRotation(0, 0, 10, 0, options);
        expect(result).toBeCloseTo(Math.PI / 4);
    });

    it("applies jitter within the expected range", () => {
        const jitter = Math.PI; // ±π/2 spread (factor is 0.5 * jitter)
        const options: RotationOptions = { mode: "flow", jitter };
        // Moving right: base angle = 0, jitter can push it at most ±π/2
        const samples = Array.from({ length: 50 }, () =>
            calculateRotation(0, 0, 10, 0, options)
        );
        const min = Math.min(...samples);
        const max = Math.max(...samples);
        expect(min).toBeGreaterThanOrEqual(-jitter / 2 - 0.001);
        expect(max).toBeLessThanOrEqual(jitter / 2 + 0.001);
    });

    it("applies smoothing by blending toward the new angle", () => {
        const prevAngle = 0;           // previous angle: pointing right
        const options: RotationOptions = {
            mode: "flow",
            smoothing: 0.5,            // t = 0.5, blend halfway
        };
        // Moving down: raw angle = π/2. With t=0.5, result ≈ π/4
        const result = calculateRotation(0, 0, 0, 10, options, prevAngle);
        expect(result).toBeCloseTo(Math.PI / 4, 2);
    });

    it("smoothing = 1 means fully commit to new angle", () => {
        const options: RotationOptions = { mode: "flow", smoothing: 1 };
        const result = calculateRotation(0, 0, 0, 10, options, 0);
        expect(result).toBeCloseTo(Math.PI / 2);
    });

    it("smoothing = 0 keeps the previous angle unchanged", () => {
        const prevAngle = Math.PI / 3;
        const options: RotationOptions = { mode: "flow", smoothing: 0 };
        const result = calculateRotation(0, 0, 0, 10, options, prevAngle);
        expect(result).toBeCloseTo(prevAngle);
    });

    it("prevAngle defaults to 0 when not supplied", () => {
        // With smoothing = 0.5 and prevAngle = 0 (default):
        // moving right → raw = 0, lerp(0, 0, 0.5) = 0
        const options: RotationOptions = { mode: "flow", smoothing: 0.5 };
        const result = calculateRotation(0, 0, 10, 0, options);
        expect(result).toBeCloseTo(0);
    });
});

// ─────────────────────────────────────────────
// calculateRotation — mode fallback
// ─────────────────────────────────────────────
describe("calculateRotation — mode fallback", () => {
    it("defaults to fixed (returns 0) when options is undefined", () => {
        const result = calculateRotation(0, 0, 50, 50, undefined);
        expect(result).toBeCloseTo(0);
    });

    it("defaults to fixed when mode is omitted from options", () => {
        const result = calculateRotation(0, 0, 50, 50, {});
        expect(result).toBeCloseTo(0);
    });
});