import { describe, expect, it } from "vitest";
import { toHashColor } from "../../src/utils/color";

describe("toHashColor", () => {
  it("normalizes 3-digit and 6-digit hex strings with trimming and lowercase conversion", () => {
    expect(toHashColor("#ffffff")).toBe("#ffffff");
    expect(toHashColor("#000000")).toBe("#000000");
    expect(toHashColor("#a1b2c3")).toBe("#a1b2c3");
    expect(toHashColor("#fff")).toBe("#ffffff");
    expect(toHashColor("#abc")).toBe("#aabbcc");
    expect(toHashColor("  #AbC  ")).toBe("#aabbcc");
    expect(toHashColor("#ABCDEF")).toBe("#abcdef");
  });

  it("converts rgb() and rgba() strings and clamps channels to [0, 255]", () => {
    expect(toHashColor("rgb(255, 255, 255)")).toBe("#ffffff");
    expect(toHashColor("rgb(0, 0, 0)")).toBe("#000000");
    expect(toHashColor("rgb(255, 0, 128)")).toBe("#ff0080");
    expect(toHashColor("rgb( 255 , 100 , 50 )")).toBe("#ff6432");
    expect(toHashColor("rgb(999, 0, 0)")).toBe("#ff0000");
    expect(toHashColor("rgb(0, 999, 0)")).toBe("#00ff00");
    expect(toHashColor("rgb(0, 0, 999)")).toBe("#0000ff");

    expect(toHashColor("rgba(255, 255, 255, 1)")).toBe("#ffffff");
    expect(toHashColor("rgba(255, 0, 128, 0.5)")).toBe("#ff0080");
    expect(toHashColor("rgba(1, 2, 3, .25)")).toBe("#010203");
    expect(toHashColor("rgba(10, 20, 30, 0)")).toBe("#0a141e");
  });

  it("returns #000000 for invalid, unsupported, or non-string inputs", () => {
    expect(toHashColor("#ff")).toBe("#000000");
    expect(toHashColor("#ffff")).toBe("#000000");
    expect(toHashColor("#ffffffff")).toBe("#000000");
    expect(toHashColor("#xyzxyz")).toBe("#000000");
    expect(toHashColor("rgb(a, b, c)")).toBe("#000000");
    expect(toHashColor("rgb(-1, 0, 0)")).toBe("#000000");
    expect(toHashColor("rgb()")).toBe("#000000");
    expect(toHashColor("rgba(255,255,255,2)")).toBe("#000000");
    expect(toHashColor("rgba(255,255,255,1.5)")).toBe("#000000");
    expect(toHashColor("rgba(test)")).toBe("#000000");
    expect(toHashColor("")).toBe("#000000");
    expect(toHashColor("   ")).toBe("#000000");
    expect(toHashColor("hsl(0, 100%, 50%)")).toBe("#000000");
    expect(toHashColor("blue")).toBe("#000000");
    expect(toHashColor("transparent")).toBe("#000000");
    expect(toHashColor(null as unknown as string)).toBe("#000000");
    expect(toHashColor(undefined as unknown as string)).toBe("#000000");
    expect(toHashColor(123 as unknown as string)).toBe("#000000");
  });

  it("returns consistent cached values across repeated normalized lookups", () => {
    expect(toHashColor("#def")).toBe("#ddeeff");
    expect(toHashColor("  #DEF  ")).toBe("#ddeeff");
  });
});
