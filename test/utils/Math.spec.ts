import { describe, expect, it } from "vitest";
import {
  clamp,
  clamp01,
  getAngle,
  getDistance,
  getDistanceSquared,
  getPointBetween,
  splitDecimal,
  wrap,
} from "../../src/utils/math";

describe("Math utilities", () => {
  it("calculates distance and squared distance accurately", () => {
    expect(getDistance(0, 0, 3, 4)).toBe(5);
    expect(getDistance(-3, -4, 0, 0)).toBe(5);
    expect(getDistanceSquared(0, 0, 3, 4)).toBe(25);
  });

  it("calculates atan2 angles across all quadrants", () => {
    expect(getAngle(0, 0, 1, 0)).toBeCloseTo(0);
    expect(getAngle(0, 0, 0, 1)).toBeCloseTo(Math.PI / 2);
    expect(getAngle(0, 0, -1, 0)).toBeCloseTo(Math.PI);
    expect(getAngle(0, 0, 0, -1)).toBeCloseTo(-Math.PI / 2);
  });

  it("interpolates and extrapolates points via getPointBetween", () => {
    expect(getPointBetween(0, 0, 10, 10)).toEqual({ x: 5, y: 5 });
    expect(getPointBetween(0, 0, 10, 10, 0)).toEqual({ x: 0, y: 0 });
    expect(getPointBetween(0, 0, 10, 10, 1)).toEqual({ x: 10, y: 10 });
    expect(getPointBetween(0, 0, 10, 10, 0.25)).toEqual({ x: 2.5, y: 2.5 });
  });

  it("splits decimals accurately and handles zero, negative, and non-finite inputs", () => {
    expect(splitDecimal(3.2)).toEqual([1, 1, 1, 0.2]);
    expect(splitDecimal(4.1, 2)).toEqual([2, 2, 0.1]);
    expect(splitDecimal(2, 1)).toEqual([1, 1]);
    expect(splitDecimal(0)).toEqual([]);
    expect(splitDecimal(5, 0)).toEqual([]);
    expect(splitDecimal(5, -1)).toEqual([]);
    expect(splitDecimal(Number.NaN)).toEqual([]);
    expect(splitDecimal(Number.POSITIVE_INFINITY)).toEqual([]);
  });

  it("clamps numbers via clamp and clamp01", () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
  });

  it("wraps positive, negative, boundary, and invalid max inputs", () => {
    expect(wrap(5, 3)).toBe(2);
    expect(wrap(-5, 3)).toBe(1);
    expect(wrap(3, 3)).toBe(0);
    expect(wrap(0, 3)).toBe(0);
    expect(wrap(5, 0)).toBe(0);
    expect(wrap(5, -2)).toBe(0);
  });
});
