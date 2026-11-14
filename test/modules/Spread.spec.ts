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
  eraser: false,
});

const createPoint = (pressure = 0.5): PurePoint => ({
  x: 10,
  y: 20,
  pressure,
});

describe("SpreadModule", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses defaults and ignores nullish overrides", () => {
    const defaults = new SpreadModule();
    expect(defaults.config).toEqual({
      spreadRange: 0.25,
      spreadTrigger: "none",
      count: 1,
      countJitter: 0,
      countJitterTrigger: "none",
    });

    const partial = new SpreadModule({
      spreadRange: null as unknown as number,
      count: 4,
    });
    expect(partial.config.spreadRange).toBe(0.25);
    expect(partial.config.count).toBe(4);
  });

  it("bindConfig replaces live config reference", () => {
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

  it("returns only original point when spreadRange <= 0", () => {
    const point = createPoint();
    expect(
      new SpreadModule({ spreadRange: 0 }).onChangePoint(point, createConfig()),
    ).toEqual([point]);
    expect(
      new SpreadModule({ spreadRange: -0.5 }).onChangePoint(
        point,
        createConfig(),
      ),
    ).toEqual([point]);
  });

  it("appends configured spread points and preserves pressure", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const module = new SpreadModule({ count: 3, spreadRange: 0.5 });
    const point = createPoint(0.7);
    const points = module.onChangePoint(point, createConfig());

    expect(points).toHaveLength(4);
    expect(points[0]).toBe(point);
    expect(points.slice(1).every((p) => p.pressure === 0.7)).toBe(true);
  });

  it("scales count with countJitter and pressure while keeping at least 1 spread point", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const jitterModule = new SpreadModule({ count: 5, countJitter: 1 });
    expect(
      jitterModule.onChangePoint(createPoint(), createConfig()),
    ).toHaveLength(2);

    const pressureModule = new SpreadModule({
      count: 5,
      countJitterTrigger: "pressure",
    });
    expect(
      pressureModule.onChangePoint(createPoint(0), createConfig()),
    ).toHaveLength(2);

    // At pressure = 0.5, pressure factor leaves count unchanged (5) -> total 6
    expect(
      pressureModule.onChangePoint(createPoint(0.5), createConfig()),
    ).toHaveLength(6);
  });

  it("scales dispersion standard deviation with pressure when spreadTrigger is pressure", () => {
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

    const pLow = module.onChangePoint(createPoint(0.25), createConfig());
    expect(pLow[1].x).toBeCloseTo(15);
    expect(pLow[1].y).toBeCloseTo(25);

    // At pressure = 0, stdDev is 0 -> spread point equals original coordinates
    const pZero = module.onChangePoint(createPoint(0), createConfig());
    expect(pZero[1].x).toBe(10);
    expect(pZero[1].y).toBe(20);
  });
});
