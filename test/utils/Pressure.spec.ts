import { describe, expect, it } from "vitest";

import { MousePressure } from "../../src/utils";

describe("MousePressure", () => {
  it("starts enabled", () => {
    const pressure = new MousePressure();

    expect(pressure.status()).toBe(true);
  });

  it("returns middle pressure for the first point", () => {
    const pressure = new MousePressure();

    expect(pressure.getPressure(0, 0)).toBe(0.5);
  });

  it("increases pressure for slow movement", () => {
    const pressure = new MousePressure();

    pressure.getPressure(0, 0);

    expect(pressure.getPressure(1, 1)).toBeGreaterThan(0.5);
  });

  it("decreases pressure for fast movement", () => {
    const pressure = new MousePressure();

    pressure.getPressure(0, 0);

    expect(pressure.getPressure(200, 0)).toBeLessThan(0.5);
  });

  it("returns middle pressure while closed", () => {
    const pressure = new MousePressure();

    pressure.close();

    expect(pressure.status()).toBe(false);
    expect(pressure.getPressure(100, 100)).toBe(0.5);
  });

  it("resets pressure state", () => {
    const pressure = new MousePressure();

    pressure.getPressure(0, 0);
    pressure.getPressure(1, 1);
    pressure.reset();

    expect(pressure.getPressure(50, 50)).toBe(0.5);
  });

  it("opens after being closed", () => {
    const pressure = new MousePressure();

    pressure.close();
    pressure.open();

    expect(pressure.status()).toBe(true);
    expect(pressure.getPressure(0, 0)).toBe(0.5);
  });
});
