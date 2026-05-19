// tests/utils/color.spec.ts

import {
    describe,
    expect,
    it,
} from "vitest";

import {
    toHashColor,
} from "../../src/utils/color";

describe("toHashColor", () => {

    /* ---------------------------------------------------------------------- */
    /*                               HEX COLORS                               */
    /* ---------------------------------------------------------------------- */

    it("should return normalized 6-digit hex color", () => {
        expect(
            toHashColor("#ffffff")
        ).toBe("#ffffff");

        expect(
            toHashColor("#000000")
        ).toBe("#000000");

        expect(
            toHashColor("#a1b2c3")
        ).toBe("#a1b2c3");
    });

    it("should expand 3-digit hex colors", () => {
        expect(
            toHashColor("#fff")
        ).toBe("#ffffff");

        expect(
            toHashColor("#000")
        ).toBe("#000000");

        expect(
            toHashColor("#abc")
        ).toBe("#aabbcc");
    });

    it("should normalize uppercase hex values", () => {
        expect(
            toHashColor("#FFF")
        ).toBe("#ffffff");

        expect(
            toHashColor("#ABCDEF")
        ).toBe("#abcdef");
    });

    /* ---------------------------------------------------------------------- */
    /*                                RGB COLORS                              */
    /* ---------------------------------------------------------------------- */

    it("should convert rgb() colors to hex", () => {
        expect(
            toHashColor("rgb(255, 255, 255)")
        ).toBe("#ffffff");

        expect(
            toHashColor("rgb(0, 0, 0)")
        ).toBe("#000000");

        expect(
            toHashColor("rgb(255, 0, 128)")
        ).toBe("#ff0080");
    });

    it("should support rgb() with extra whitespace", () => {
        expect(
            toHashColor("rgb( 255 , 100 , 50 )")
        ).toBe("#ff6432");
    });

    /* ---------------------------------------------------------------------- */
    /*                               RGBA COLORS                              */
    /* ---------------------------------------------------------------------- */

    it("should convert rgba() colors to hex", () => {
        expect(
            toHashColor("rgba(255, 255, 255, 1)")
        ).toBe("#ffffff");

        expect(
            toHashColor("rgba(255, 0, 128, 0.5)")
        ).toBe("#ff0080");

        expect(
            toHashColor("rgba(10, 20, 30, 0)")
        ).toBe("#0a141e");
    });

    it("should ignore alpha channel in rgba()", () => {
        const c1 =
            toHashColor(
                "rgba(255, 0, 0, 0)"
            );

        const c2 =
            toHashColor(
                "rgba(255, 0, 0, 1)"
            );

        expect(c1).toBe("#ff0000");

        expect(c2).toBe("#ff0000");
    });

    /* ---------------------------------------------------------------------- */
    /*                             INVALID INPUTS                             */
    /* ---------------------------------------------------------------------- */

    it("should return default color for invalid hex", () => {
        expect(
            toHashColor("#ff")
        ).toBe("#000000");

        expect(
            toHashColor("#ffff")
        ).toBe("#000000");

        expect(
            toHashColor("#xyzxyz")
        ).toBe("#000000");
    });

    it("should return default color for invalid rgb()", () => {
        expect(
            toHashColor("rgb(999, 0, 0)")
        ).toBe("#ff0000");

        expect(
            toHashColor("rgb(a, b, c)")
        ).toBe("#000000");

        expect(
            toHashColor("rgb()")
        ).toBe("#000000");
    });

    it("should return default color for invalid rgba()", () => {
        expect(
            toHashColor("rgba(255,255,255,2)")
        ).toBe("#000000");

        expect(
            toHashColor("rgba(test)")
        ).toBe("#000000");
    });

    it("should return default color for empty strings", () => {
        expect(
            toHashColor("")
        ).toBe("#000000");

        expect(
            toHashColor("   ")
        ).toBe("#000000");
    });

    it("should return default color for unsupported formats", () => {
        expect(
            toHashColor("hsl(0, 100%, 50%)")
        ).toBe("#000000");

        expect(
            toHashColor("blue")
        ).toBe("#000000");

        expect(
            toHashColor("transparent")
        ).toBe("#000000");
    });

    it("should return default color for non-string values", () => {
        expect(
            toHashColor(null as unknown as string)
        ).toBe("#000000");

        expect(
            toHashColor(undefined as unknown as string)
        ).toBe("#000000");

        expect(
            toHashColor(123 as unknown as string)
        ).toBe("#000000");
    });

    /* ---------------------------------------------------------------------- */
    /*                              CACHE BEHAVIOR                            */
    /* ---------------------------------------------------------------------- */

    it("should return same cached value consistently", () => {
        const first =
            toHashColor("#abc");

        const second =
            toHashColor("#abc");

        expect(first).toBe(second);
    });

    /* ---------------------------------------------------------------------- */
    /*                           CHANNEL CLAMP TESTS                          */
    /* ---------------------------------------------------------------------- */

    it("should clamp rgb channels correctly", () => {
        expect(
            toHashColor("rgb(999, 0, 0)")
        ).toBe("#ff0000");

        expect(
            toHashColor("rgb(0, 999, 0)")
        ).toBe("#00ff00");

        expect(
            toHashColor("rgb(0, 0, 999)")
        ).toBe("#0000ff");
    });

});