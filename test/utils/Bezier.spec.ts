// tests/bezier.spec.ts

import {
    describe,
    it,
    expect,
} from "vitest";

import {
    quadraticBezier,
    getQuadraticBezierDistance,
    getEquidistantBezierPoints,
    getControlPoint,
    getAllControlPoint,
    findTForLength,
} from "../../src/utils/bezier";

describe("quadraticBezier", () => {
    it("should return start point at t = 0", () => {
        const point = quadraticBezier(
            0,
            0,
            0,
            50,
            100,
            100,
            0
        );

        expect(point).toEqual({
            x: 0,
            y: 0,
        });
    });

    it("should return end point at t = 1", () => {
        const point = quadraticBezier(
            1,
            0,
            0,
            50,
            100,
            100,
            0
        );

        expect(point).toEqual({
            x: 100,
            y: 0,
        });
    });

    it("should clamp t below 0", () => {
        const point = quadraticBezier(
            -10,
            0,
            0,
            50,
            100,
            100,
            0
        );

        expect(point).toEqual({
            x: 0,
            y: 0,
        });
    });

    it("should clamp t above 1", () => {
        const point = quadraticBezier(
            10,
            0,
            0,
            50,
            100,
            100,
            0
        );

        expect(point).toEqual({
            x: 100,
            y: 0,
        });
    });

    it("should correctly evaluate midpoint", () => {
        const point = quadraticBezier(
            0.5,
            0,
            0,
            50,
            100,
            100,
            0
        );

        expect(point.x).toBeCloseTo(50);
        expect(point.y).toBeCloseTo(50);
    });
});

describe("getQuadraticBezierDistance", () => {
    it("should return 0 for invalid segment count", () => {
        const length = getQuadraticBezierDistance(
            0,
            0,
            50,
            100,
            100,
            0,
            0
        );

        expect(length).toBe(0);
    });

    it("should calculate a positive curve length", () => {
        const length = getQuadraticBezierDistance(
            0,
            0,
            50,
            100,
            100,
            0
        );

        expect(length).toBeGreaterThan(100);
    });

    it("should support partial curve length", () => {
        const full = getQuadraticBezierDistance(
            0,
            0,
            50,
            100,
            100,
            0
        );

        const half = getQuadraticBezierDistance(
            0,
            0,
            50,
            100,
            100,
            0,
            100,
            0.5
        );

        expect(half).toBeLessThan(full);
        expect(half).toBeGreaterThan(0);
    });

    it("should return 0 length for degenerate curve", () => {
        const length = getQuadraticBezierDistance(
            10,
            10,
            10,
            10,
            10,
            10
        );

        expect(length).toBeCloseTo(0);
    });
});

describe("getEquidistantBezierPoints", () => {
    it("should return empty array for invalid spacing", () => {
        const points = getEquidistantBezierPoints(
            0,
            0,
            50,
            100,
            100,
            0,
            0
        );

        expect(points).toEqual([]);
    });

    it("should generate equidistant points", () => {
        const points = getEquidistantBezierPoints(
            0,
            0,
            50,
            100,
            100,
            0,
            10
        );

        expect(points.length).toBeGreaterThan(0);

        for (let i = 1; i < points.length; i++) {
            const dx =
                points[i].x - points[i - 1].x;

            const dy =
                points[i].y - points[i - 1].y;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            expect(distance).toBeGreaterThan(5);
        }
    });

    it("should return empty array for degenerate curve", () => {
        const points = getEquidistantBezierPoints(
            10,
            10,
            10,
            10,
            10,
            10,
            10
        );

        expect(points).toEqual([]);
    });
});

describe("getControlPoint", () => {
    it("should generate control point", () => {
        const point = getControlPoint(
            0,
            0,
            50,
            50,
            100,
            0
        );

        expect(point).toHaveProperty("x");
        expect(point).toHaveProperty("y");
    });

    it("should respect ratio", () => {
        const pointA = getControlPoint(
            0,
            0,
            50,
            50,
            100,
            0,
            0.25
        );

        const pointB = getControlPoint(
            0,
            0,
            50,
            50,
            100,
            0,
            0.5
        );

        expect(pointA.x).not.toBe(pointB.x);
    });
});

describe("getAllControlPoint", () => {
    it("should return two control points", () => {
        const points = getAllControlPoint(
            0,
            0,
            50,
            50,
            100,
            0
        );

        expect(points.length).toBe(2);

        expect(points[0]).toHaveProperty("x");
        expect(points[0]).toHaveProperty("y");

        expect(points[1]).toHaveProperty("x");
        expect(points[1]).toHaveProperty("y");
    });
});

describe("findTForLength", () => {
    it("should return 0 for target length <= 0", () => {
        const t = findTForLength(
            0,
            0,
            50,
            100,
            100,
            0,
            0
        );

        expect(t).toBe(0);
    });

    it("should return 1 for target length greater than curve length", () => {
        const t = findTForLength(
            0,
            0,
            50,
            100,
            100,
            0,
            999999
        );

        expect(t).toBe(1);
    });

    it("should return a valid t for half curve length", () => {
        const totalLength =
            getQuadraticBezierDistance(
                0,
                0,
                50,
                100,
                100,
                0
            );

        const t = findTForLength(
            0,
            0,
            50,
            100,
            100,
            0,
            totalLength / 2
        );

        expect(t).toBeGreaterThan(0);
        expect(t).toBeLessThan(1);
    });

    it("should produce approximately correct arc length", () => {
        const totalLength =
            getQuadraticBezierDistance(
                0,
                0,
                50,
                100,
                100,
                0
            );

        const target = totalLength * 0.25;

        const t = findTForLength(
            0,
            0,
            50,
            100,
            100,
            0,
            target
        );

        const computed =
            getQuadraticBezierDistance(
                0,
                0,
                50,
                100,
                100,
                0,
                100,
                t
            );

        expect(computed).toBeCloseTo(
            target,
            1
        );
    });
});