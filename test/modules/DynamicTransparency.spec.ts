import { afterEach, describe, expect, it, vi } from "vitest";

import { DynamicTransparencyModule } from "../../src/modules";
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

describe("DynamicTransparencyModule", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses defaults when no config is provided", () => {
    const module = new DynamicTransparencyModule();

    expect(module.config.opacityJitter).toBe(0);
    expect(module.config.opacityJitterTrigger).toBe("none");
    expect(module.config.flowJitter).toBe(0);
    expect(module.config.flowJitterTrigger).toBe("none");
  });

  it("bindConfig replaces the live config reference", () => {
    const module = new DynamicTransparencyModule();
    const config = {
      opacityJitter: 0.2,
      opacityJitterTrigger: "pressure" as const,
      minOpacityJitter: 0.1,
      flowJitter: 0.3,
      flowJitterTrigger: "pressure" as const,
      minFlowJitter: 0.2,
    };

    module.bindConfig(config);

    expect(module.config).toBe(config);
  });

  it("locks opacity for a stroke until onEndStroke is called", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(1);

    const module = new DynamicTransparencyModule({
      opacityJitter: 1,
    });
    const first = createConfig();
    const second = createConfig();
    const third = createConfig();

    module.onChangeConfig(first, 1);
    module.onChangeConfig(second, 1);
    module.onEndStroke();
    module.onChangeConfig(third, 1);

    expect(first.opacity).toBe(0);
    expect(second.opacity).toBe(0);
    expect(third.opacity).toBe(1);
  });

  it("can drive opacity and flow from pressure", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);

    const module = new DynamicTransparencyModule({
      opacityJitterTrigger: "pressure",
      flowJitterTrigger: "pressure",
    });
    const config = createConfig();

    module.onChangeConfig(config, 0.25);

    expect(config.opacity).toBe(0.5);
    expect(config.flow).toBe(0.5);
  });

  it("respects opacity and flow minimums", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const module = new DynamicTransparencyModule({
      opacityJitter: 1,
      minOpacityJitter: 0.25,
      flowJitter: 1,
      minFlowJitter: 0.4,
    });
    const config = createConfig();

    module.onChangeConfig(config, 1);

    expect(config.opacity).toBe(0.25);
    expect(config.flow).toBe(0.4);
  });
});
