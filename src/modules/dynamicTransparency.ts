// src/modules/dynamicTransparency.ts

import { BrushBasicConfig } from "../types/config";
import {
  DynamicTransparencyBasicConfig,
  DynamicTransparencyConfig,
} from "../types/dynamicTransparency";

import { clamp } from "../utils/math";
import { randomRound } from "../utils/random";

const defaultConfig: DynamicTransparencyBasicConfig = {
  opacityJitter: 0.0,
  opacityJitterTrigger: "none",
  minOpacityJitter: 0.0,

  flowJitter: 0.0,
  flowJitterTrigger: "none",
  minFlowJitter: 0.0,
};

/**
 * Adds random and pressure-driven opacity/flow variation.
 *
 * Useful for:
 * - watercolor brushes
 * - dry brushes
 * - airbrush effects
 * - organic accumulation
 */
export class DynamicTransparencyModule {
  config: DynamicTransparencyBasicConfig;

  private strokeOpacity: number = -1;

  constructor(config?: DynamicTransparencyConfig) {
    this.config = {
      ...defaultConfig,
      ...Object.fromEntries(
        Object.entries(config ?? {}).filter(([, v]) => v != null),
      ),
    } as DynamicTransparencyBasicConfig;
  }

  bindConfig(config: DynamicTransparencyBasicConfig): void {
    this.config = config;
  }

  // ─────────────────────────────────────────────

  private changeOpacity(opacity: number, pressure: number): number {
    if (this.strokeOpacity !== -1) {
      return this.strokeOpacity;
    }

    let next = opacity;

    if (this.config.opacityJitterTrigger === "pressure") {
      next *= pressure * 2;
    }

    const jitter = next * this.config.opacityJitter;

    next = clamp(randomRound(next - jitter, next, 100), 0, 1);

    const floor = opacity * this.config.minOpacityJitter;

    if (next < floor) next = floor;

    this.strokeOpacity = next;

    return next;
  }

  private changeFlow(flow: number, pressure: number): number {
    let next = flow;

    if (this.config.flowJitterTrigger === "pressure") {
      next *= pressure * 2;
    }

    const jitter = next * this.config.flowJitter;

    next = clamp(randomRound(next - jitter, next, 100), 0, 1);

    const floor = flow * this.config.minFlowJitter;

    if (next < floor) next = floor;

    return next;
  }

  // ─────────────────────────────────────────────

  onChangeConfig(config: BrushBasicConfig, pressure: number): void {
    config.opacity = this.changeOpacity(config.opacity, pressure);

    config.flow = this.changeFlow(config.flow, pressure);
  }

  /**
   * Reset cached stroke opacity after stroke ends.
   */
  onEndStroke(): void {
    this.strokeOpacity = -1;
  }
}
