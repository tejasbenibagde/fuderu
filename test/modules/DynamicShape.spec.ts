import { afterEach, describe, expect, it, vi } from "vitest";
import { DynamicShapeModule } from "../../src/modules";
import type { BrushBasicConfig } from "../../src/types";

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

describe("DynamicShapeModule", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses defaults when no config is provided and ignores nullish overrides", () => {
    const defaults = new DynamicShapeModule();
    expect(defaults.config).toEqual({
      sizeJitter: 0,
      sizeJitterTrigger: "none",
      minDiameter: 0,
      angleJitter: 0,
      angleJitterTrigger: "none",
      roundJitter: 0,
      roundJitterTrigger: "none",
      minRoundness: 0,
    });

    const partial = new DynamicShapeModule({
      sizeJitter: null as unknown as number,
      minDiameter: 0.25,
      angleJitter: undefined,
    });
    expect(partial.config.sizeJitter).toBe(0);
    expect(partial.config.angleJitter).toBe(0);
    expect(partial.config.minDiameter).toBe(0.25);
  });

  it("bindConfig replaces the live config reference and drives subsequent stamps", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const module = new DynamicShapeModule();
    const externalConfig = {
      sizeJitter: 0.5,
      sizeJitterTrigger: "none" as const,
      minDiameter: 0.1,
      angleJitter: 0,
      angleJitterTrigger: "none" as const,
      roundJitter: 0,
      roundJitterTrigger: "none" as const,
      minRoundness: 0,
    };

    module.bindConfig(externalConfig);
    expect(module.config).toBe(externalConfig);

    const stamp = createConfig();
    module.onChangeConfig(stamp, 1);
    expect(stamp.size).toBe(10);
  });

  it("applies size jitter and enforces minDiameter floor", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const module = new DynamicShapeModule({
      sizeJitter: 1,
      minDiameter: 0.35,
    });
    const config = createConfig();

    module.onChangeConfig(config, 1);

    expect(config.size).toBeCloseTo(7);
  });

  it("scales size linearly with pressure up to 2x before jitter", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);

    const low = createConfig();
    const mid = createConfig();
    const high = createConfig();
    const module = new DynamicShapeModule({ sizeJitterTrigger: "pressure" });

    module.onChangeConfig(low, 0);
    module.onChangeConfig(mid, 0.25);
    module.onChangeConfig(high, 1);

    expect(low.size).toBe(0);
    expect(mid.size).toBe(10);
    expect(high.size).toBe(40);
  });

  it("rotates angle forward when pressure <= 0.5 and backward when pressure > 0.5", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const module = new DynamicShapeModule({
      angleJitterTrigger: "pressure",
    });

    const lowPressure = createConfig();
    module.onChangeConfig(lowPressure, 0.25);
    expect(lowPressure.angle).toBeCloseTo(Math.PI / 2);

    const highPressure = createConfig();
    module.onChangeConfig(highPressure, 0.75);
    expect(highPressure.angle).toBeCloseTo(-Math.PI / 2);
  });

  it("applies angle jitter within +-2*PI*angleJitter", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);
    const module = new DynamicShapeModule({ angleJitter: 0.25 });
    const config = createConfig();

    module.onChangeConfig(config, 0.5);
    expect(config.angle).toBeCloseTo(Math.PI / 2);
  });

  it("drives roundness via pressure and jitter while enforcing minRoundness", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const module = new DynamicShapeModule({
      roundJitter: 1,
      minRoundness: 0.3,
    });
    const config = createConfig();

    module.onChangeConfig(config, 1);
    expect(config.roundness).toBeCloseTo(0.3);

    vi.spyOn(Math, "random").mockReturnValue(1);
    const pressureModule = new DynamicShapeModule({
      roundJitterTrigger: "pressure",
    });
    const pressureConfig = createConfig();
    pressureModule.onChangeConfig(pressureConfig, 0.25);
    expect(pressureConfig.roundness).toBeCloseTo(0.5);
  });
});
