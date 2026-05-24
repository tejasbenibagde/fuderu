import { afterEach, describe, expect, it, vi } from "vitest";

import { SpreadModule } from "../../src/modules";
import type { BrushBasicConfig, PurePoint } from "../../src/types";

const createConfig = (): BrushBasicConfig => ({
  size: 20,
  opacity: 1,
  flow: 1,
  color: "#000000",
  angle: 0,
  roundness: 1,
  spacing: 0.5,
});

const createPoint = (): PurePoint => ({
  x: 10,
  y: 20,
  pressure: 0.5,
});

describe("SpreadModule", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses defaults when no config is provided", () => {
    const module = new SpreadModule();

    expect(module.config.spreadRange).toBe(0.25);
    expect(module.config.spreadTrigger).toBe("none");
    expect(module.config.count).toBe(1);
  });

  it("bindConfig replaces the live config reference", () => {
    const module = new SpreadModule();
    const config = {
      spreadRange: 0.5,
      spreadTrigger: "pressure" as const,
      count: 3,
      countJitter: 0.2,
      countJitterTrigger: "pressure" as const,
    };

    module.bindConfig(config);

    expect(module.config).toBe(config);
  });

  it("returns the original point when spread is disabled", () => {
    const module = new SpreadModule({ spreadRange: 0 });
    const point = createPoint();

    expect(module.onChangePoint(point, createConfig())).toEqual([point]);
  });

  it("adds configured spread points", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const module = new SpreadModule({ count: 3, spreadRange: 0.5 });
    const point = createPoint();
    const points = module.onChangePoint(point, createConfig());

    expect(points).toHaveLength(4);
    expect(points[0]).toBe(point);
    expect(points.slice(1).every((p) => p.pressure === point.pressure)).toBe(
      true,
    );
  });

  it("can drive count from pressure but keeps at least one spread point", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const module = new SpreadModule({
      count: 5,
      countJitterTrigger: "pressure",
    });
    const point = { ...createPoint(), pressure: 0 };
    const points = module.onChangePoint(point, createConfig());

    expect(points).toHaveLength(2);
  });

  it("uses pressure to reduce spread distance", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(Math.exp(-0.5))
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(Math.exp(-0.5))
      .mockReturnValueOnce(0);

    const module = new SpreadModule({
      count: 1,
      spreadRange: 1,
      spreadTrigger: "pressure",
    });
    const point = { ...createPoint(), pressure: 0.25 };
    const points = module.onChangePoint(point, createConfig());

    expect(points[1].x).toBeCloseTo(15);
    expect(points[1].y).toBeCloseTo(25);
  });
});
