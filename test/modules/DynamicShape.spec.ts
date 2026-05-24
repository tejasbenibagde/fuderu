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
});

describe("DynamicShapeModule", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses defaults when no config is provided", () => {
    const module = new DynamicShapeModule();

    expect(module.config.sizeJitter).toBe(0);
    expect(module.config.sizeJitterTrigger).toBe("none");
    expect(module.config.angleJitter).toBe(0);
    expect(module.config.roundJitter).toBe(0);
  });

  it("ignores nullish constructor values and keeps defaults", () => {
    const module = new DynamicShapeModule({
      sizeJitter: null as unknown as number,
      minDiameter: 0.25,
    });

    expect(module.config.sizeJitter).toBe(0);
    expect(module.config.minDiameter).toBe(0.25);
  });

  it("bindConfig replaces the live config reference", () => {
    const module = new DynamicShapeModule();
    const config = {
      sizeJitter: 0.2,
      sizeJitterTrigger: "pressure" as const,
      minDiameter: 0.1,
      angleJitter: 0.3,
      angleJitterTrigger: "pressure" as const,
      roundJitter: 0.4,
      roundJitterTrigger: "pressure" as const,
      minRoundness: 0.2,
    };

    module.bindConfig(config);

    expect(module.config).toBe(config);
  });

  it("applies size jitter and respects minimum diameter", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const module = new DynamicShapeModule({
      sizeJitter: 1,
      minDiameter: 0.5,
    });
    const config = createConfig();

    module.onChangeConfig(config, 1);

    expect(config.size).toBe(10);
  });

  it("can drive size from pressure before jitter", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);

    const module = new DynamicShapeModule({
      sizeJitterTrigger: "pressure",
    });
    const config = createConfig();

    module.onChangeConfig(config, 0.25);

    expect(config.size).toBe(10);
  });

  it("can drive angle from pressure", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const module = new DynamicShapeModule({
      angleJitterTrigger: "pressure",
    });
    const config = createConfig();

    module.onChangeConfig(config, 0.25);

    expect(config.angle).toBeCloseTo(Math.PI / 2);
  });

  it("applies roundness jitter and respects minimum roundness", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const module = new DynamicShapeModule({
      roundJitter: 1,
      minRoundness: 0.25,
    });
    const config = createConfig();

    module.onChangeConfig(config, 1);

    expect(config.roundness).toBe(0.25);
  });
});
