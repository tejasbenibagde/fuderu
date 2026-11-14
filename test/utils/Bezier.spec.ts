import { describe, expect, it } from "vitest";
import {
  findTForLength,
  getAllControlPoint,
  getControlPoint,
  getEquidistantBezierPoints,
  getQuadraticBezierDistance,
  quadraticBezier,
} from "../../src/utils/bezier";

describe("quadraticBezier", () => {
  it("evaluates exact start, end, midpoint, and clamped t values", () => {
    expect(quadraticBezier(0, 0, 0, 50, 100, 100, 0)).toEqual({ x: 0, y: 0 });
    expect(quadraticBezier(1, 0, 0, 50, 100, 100, 0)).toEqual({
      x: 100,
      y: 0,
    });
    expect(quadraticBezier(-10, 0, 0, 50, 100, 100, 0)).toEqual({
      x: 0,
      y: 0,
    });
    expect(quadraticBezier(10, 0, 0, 50, 100, 100, 0)).toEqual({
      x: 100,
      y: 0,
    });

    const mid = quadraticBezier(0.5, 0, 0, 50, 100, 100, 0);
    expect(mid.x).toBeCloseTo(50);
    expect(mid.y).toBeCloseTo(50);

    const quarter = quadraticBezier(0.25, 0, 0, 50, 100, 100, 0);
    expect(quarter.x).toBeCloseTo(25);
    expect(quarter.y).toBeCloseTo(37.5);
  });
});

describe("getQuadraticBezierDistance", () => {
  it("computes exact straight-line length, partial maxT length, and zero on invalid/degenerate inputs", () => {
    expect(getQuadraticBezierDistance(0, 0, 50, 100, 100, 0, 0)).toBe(0);
    expect(getQuadraticBezierDistance(10, 10, 10, 10, 10, 10)).toBeCloseTo(0);

    // Collinear control point at midpoint produces exact straight distance 100
    expect(getQuadraticBezierDistance(0, 0, 50, 0, 100, 0, 100, 1)).toBeCloseTo(
      100,
    );
    expect(
      getQuadraticBezierDistance(0, 0, 50, 0, 100, 0, 100, 0.35),
    ).toBeCloseTo(35);

    const curved = getQuadraticBezierDistance(0, 0, 50, 100, 100, 0);
    expect(curved).toBeGreaterThan(100);
  });
});

describe("getEquidistantBezierPoints", () => {
  it("returns empty array for invalid spacing or degenerate curves", () => {
    expect(getEquidistantBezierPoints(0, 0, 50, 100, 100, 0, 0)).toEqual([]);
    expect(getEquidistantBezierPoints(0, 0, 50, 100, 100, 0, -5)).toEqual([]);
    expect(getEquidistantBezierPoints(10, 10, 10, 10, 10, 10, 10)).toEqual([]);
  });

  it("generates monotonic approximately equidistant points along the curve", () => {
    const space = 10;
    const points = getEquidistantBezierPoints(0, 0, 50, 0, 100, 0, space, 200);

    expect(points.length).toBeGreaterThanOrEqual(9);
    expect(points.length).toBeLessThanOrEqual(10);

    let prev = { x: 0, y: 0 };
    for (const p of points) {
      const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
      expect(dist).toBeGreaterThanOrEqual(space - 1e-6);
      expect(dist).toBeLessThanOrEqual(space + 1.5);
      expect(p.x).toBeGreaterThan(prev.x);
      expect(p.y).toBeCloseTo(0);
      prev = p;
    }
  });
});

describe("getControlPoint & getAllControlPoint", () => {
  it("computes exact control point coordinates and scales linearly with ratio", () => {
    const cpDefault = getControlPoint(0, 0, 50, 50, 100, 20);
    // p2x + (p1x - p3x)*0.25 = 50 + (-100)*0.25 = 25
    // p2y + (p1y - p3y)*0.25 = 50 + (-20)*0.25 = 45
    expect(cpDefault).toEqual({ x: 25, y: 45 });

    const cpHalf = getControlPoint(0, 0, 50, 50, 100, 20, 0.5);
    expect(cpHalf).toEqual({ x: 0, y: 40 });

    const [cp1, cp2] = getAllControlPoint(10, 20, 50, 60, 90, 40, 0.25);
    expect(cp1).toEqual({ x: 30, y: 55 });
    expect(cp2).toEqual({ x: 20, y: 30 });
  });
});

describe("findTForLength", () => {
  it("solves arc-length parameter t accurately across boundaries and interior points", () => {
    expect(findTForLength(0, 0, 50, 100, 100, 0, 0)).toBe(0);
    expect(findTForLength(0, 0, 50, 100, 100, 0, -10)).toBe(0);
    expect(findTForLength(0, 0, 50, 100, 100, 0, 999999)).toBe(1);

    // Exact analytical check on linear curve of length 100
    expect(findTForLength(0, 0, 50, 0, 100, 0, 25)).toBeCloseTo(0.25, 2);

    const totalLength = getQuadraticBezierDistance(0, 0, 50, 100, 100, 0);
    const target = totalLength * 0.25;
    const t = findTForLength(0, 0, 50, 100, 100, 0, target);
    const computed = getQuadraticBezierDistance(0, 0, 50, 100, 100, 0, 100, t);

    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(1);
    expect(computed).toBeCloseTo(target, 1);
  });
});
