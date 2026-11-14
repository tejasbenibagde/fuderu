import { afterEach, describe, expect, it, vi } from "vitest";
import { DynamicTransparencyModule } from "../../src/modules";
import type { BrushBasicConfig } from "../../src/types";

const createConfig = (): BrushBasicConfig => ({
  size: 20,
  opacity: 0.8,
  flow: 0.6,
  color: "#000000",
  angle: 0,
  roundness: 1,
  spacing: 0.5,
  eraser: false,
});

describe("DynamicTransparencyModule", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses defaults and ignores nullish constructor options", () => {
    const defaults = new DynamicTransparencyModule();
    expect(defaults.config).toEqual({
      opacityJitter: 0,
      opacityJitterTrigger: "none",
      minOpacityJitter: 0,
      flowJitter: 0,
      flowJitterTrigger: "none",
      minFlowJitter: 0,
    });

    const partial = new DynamicTransparencyModule({
      opacityJitter: null as unknown as number,
      flowJitter: 0.4,
    });
    expect(partial.config.opacityJitter).toBe(0);
    expect(partial.config.flowJitter).toBe(0.4);
  });

  it("bindConfig replaces live config reference", () => {
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

  it("locks strokeOpacity across stamps until onEndStroke is called while still jittering flow per stamp", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0) // first stamp opacity
      .mockReturnValueOnce(0) // first stamp flow
      .mockReturnValueOnce(1) // second stamp flow (opacity cached)
      .mockReturnValueOnce(1) // third stamp opacity (after onEndStroke)
      .mockReturnValueOnce(0.5); // third stamp flow

    const module = new DynamicTransparencyModule({
      opacityJitter: 1,
      flowJitter: 1,
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
    expect(first.flow).toBe(0);
    expect(second.flow).toBeCloseTo(0.6);
    expect(third.opacity).toBeCloseTo(0.8);
    expect(third.flow).toBeCloseTo(0.3);
  });

  it("drives opacity and flow from pressure and clamps at [0, 1]", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);

    const module = new DynamicTransparencyModule({
      opacityJitterTrigger: "pressure",
      flowJitterTrigger: "pressure",
    });

    const low = createConfig();
    module.onChangeConfig(low, 0.25);
    expect(low.opacity).toBeCloseTo(0.4);
    expect(low.flow).toBeCloseTo(0.3);

    module.onEndStroke();
    const high = createConfig();
    module.onChangeConfig(high, 1);
    expect(high.opacity).toBe(1);
    expect(high.flow).toBe(1);
  });

  it("enforces minOpacityJitter and minFlowJitter proportional to base values", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const module = new DynamicTransparencyModule({
      opacityJitter: 1,
      minOpacityJitter: 0.25,
      flowJitter: 1,
      minFlowJitter: 0.5,
    });
    const config = createConfig();

    module.onChangeConfig(config, 1);

    expect(config.opacity).toBeCloseTo(0.2); // 0.8 * 0.25
    expect(config.flow).toBeCloseTo(0.3); // 0.6 * 0.5
  });
});
