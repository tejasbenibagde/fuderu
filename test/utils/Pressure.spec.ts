import { describe, expect, it } from "vitest";
import { MousePressure } from "../../src/utils";

describe("MousePressure", () => {
  it("starts enabled and returns middle pressure (0.5) for initial point", () => {
    const pressure = new MousePressure();
    expect(pressure.status()).toBe(true);
    expect(pressure.getPressure(0, 0)).toBe(0.5);
  });

  it("increases pressure monotonically for slow movement and saturates at 0.8", () => {
    const pressure = new MousePressure();
    let prev = pressure.getPressure(0, 0);

    for (let i = 1; i <= 30; i++) {
      const next = pressure.getPressure(i * 2, 0);
      expect(next).toBeGreaterThanOrEqual(prev);
      expect(next).toBeLessThanOrEqual(0.8);
      prev = next;
    }

    expect(prev).toBeCloseTo(0.8);
  });

  it("decreases pressure monotonically for fast movement and floors at 0.2", () => {
    const pressure = new MousePressure();
    let prev = pressure.getPressure(0, 0);

    for (let i = 1; i <= 30; i++) {
      const next = pressure.getPressure(i * 200, 0);
      expect(next).toBeLessThanOrEqual(prev);
      expect(next).toBeGreaterThanOrEqual(0.2);
      prev = next;
    }

    expect(prev).toBeCloseTo(0.2);
  });

  it("nudges pressure back toward 0.5 during medium-speed movement", () => {
    const pressure = new MousePressure();
    pressure.getPressure(0, 0);
    const high = pressure.getPressure(2, 0); // > 0.5
    const settled = pressure.getPressure(52, 0); // dist = 50 in [10, 100]

    expect(high).toBeGreaterThan(0.5);
    expect(settled).toBeLessThan(high);
  });

  it("respects custom k, minRange, and maxRange parameters", () => {
    const pressure = new MousePressure(3, 5, 20);
    pressure.getPressure(0, 0);
    // Distance 25 > maxRange 20 decreases pressure even though 25 would be medium for defaults
    expect(pressure.getPressure(25, 0)).toBeLessThan(0.5);
  });

  it("supports close, open, and reset lifecycle cleanly", () => {
    const pressure = new MousePressure();
    pressure.getPressure(0, 0);
    expect(pressure.getPressure(1, 1)).toBeGreaterThan(0.5);

    pressure.reset();
    expect(pressure.getPressure(100, 100)).toBe(0.5);

    pressure.close();
    expect(pressure.status()).toBe(false);
    expect(pressure.getPressure(100, 100)).toBe(0.5);

    pressure.open();
    expect(pressure.status()).toBe(true);
    expect(pressure.getPressure(0, 0)).toBe(0.5);
  });
});
