// tests/utils/math.spec.ts

import {
    describe,
    expect,
    it,
} from "vitest";

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

describe("getDistance", () => {

    it("should calculate distance correctly", () => {
        expect(
            getDistance(0, 0, 3, 4)
        ).toBe(5);
    });

});

describe("getDistanceSquared", () => {

    it("should calculate squared distance correctly", () => {
        expect(
            getDistanceSquared(0, 0, 3, 4)
        ).toBe(25);
    });

});

describe("getAngle", () => {

    it("should calculate angle correctly", () => {
        expect(
            getAngle(0, 0, 1, 0)
        ).toBeCloseTo(0);

        expect(
            getAngle(0, 0, 0, 1)
        ).toBeCloseTo(
            Math.PI / 2
        );
    });

});

describe("getPointBetween", () => {

    it("should return midpoint by default", () => {
        expect(
            getPointBetween(0, 0, 10, 10)
        ).toEqual({
            x: 5,
            y: 5,
        });
    });

    it("should interpolate correctly", () => {
        expect(
            getPointBetween(
                0,
                0,
                10,
                10,
                0.25
            )
        ).toEqual({
            x: 2.5,
            y: 2.5,
        });
    });

});

describe("splitDecimal", () => {

    it("should split decimals correctly", () => {
        expect(
            splitDecimal(3.2)
        ).toEqual([
            1,
            1,
            1,
            0.2,
        ]);
    });

    it("should split using custom unit", () => {
        expect(
            splitDecimal(4.1, 2)
        ).toEqual([
            2,
            2,
            0.1,
        ]);
    });

    it("should return empty array for invalid unit", () => {
        expect(
            splitDecimal(5, 0)
        ).toEqual([]);
    });

});

describe("clamp", () => {

    it("should clamp values correctly", () => {
        expect(
            clamp(5, 1, 3)
        ).toBe(3);

        expect(
            clamp(-1, 0, 10)
        ).toBe(0);

        expect(
            clamp(5, 0, 10)
        ).toBe(5);
    });

});

describe("clamp01", () => {

    it("should clamp between 0 and 1", () => {
        expect(
            clamp01(-1)
        ).toBe(0);

        expect(
            clamp01(2)
        ).toBe(1);

        expect(
            clamp01(0.5)
        ).toBe(0.5);
    });

});

describe("wrap", () => {

    it("should wrap positive numbers", () => {
        expect(
            wrap(5, 3)
        ).toBe(2);
    });

    it("should wrap negative numbers", () => {
        expect(
            wrap(-5, 3)
        ).toBe(1);
    });

    it("should wrap max boundary to 0", () => {
        expect(
            wrap(3, 3)
        ).toBe(0);
    });

    it("should return 0 for invalid max", () => {
        expect(
            wrap(5, 0)
        ).toBe(0);
    });

});