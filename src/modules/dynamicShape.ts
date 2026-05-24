// src/modules/dynamicShape.ts

import { BrushBasicConfig } from "../types/config";
import { DynamicShapeBasicConfig, DynamicShapeConfig } from "../types/dynamicShape";
import { clamp } from "../utils/math";
import { randomRound } from "../utils/random";

const defaultConfig: DynamicShapeBasicConfig = {
    sizeJitter: 0.00,
    sizeJitterTrigger: "none",
    minDiameter: 0.00,
    angleJitter: 0.00,
    angleJitterTrigger: "none",
    roundJitter: 0.00,
    roundJitterTrigger: "none",
    minRoundness: 0.00,
};

/**
 * Adds per-stamp randomisation of size, angle, and roundness.
 *
 * Each property can vary by a random jitter amount and optionally
 * be driven by stylus/simulated pressure.
 *
 * Register with: `brush.useModule(new DynamicShapeModule({ sizeJitter: 0.5 }))`
 */
export class DynamicShapeModule {
    /** Live config — mutate freely at runtime */
    config: DynamicShapeBasicConfig;

    constructor(config?: DynamicShapeConfig) {
        // Spread defaults first, then overlay any provided values
        this.config = {
            ...defaultConfig,
            ...Object.fromEntries(
                Object.entries(config ?? {}).filter(([, v]) => v != null)
            ),
        } as DynamicShapeBasicConfig;
    }

    /**
     * Replace the config reference entirely.
     * Useful for binding to a reactive external config object.
     */
    bindConfig(config: DynamicShapeBasicConfig): void {
        this.config = config;
    }

    // ─── Private helpers ──────────────────────────────────

    private changeSize(size: number, pressure: number): number {
        let newSize = size;

        // Pressure drives the base size before jitter
        if (this.config.sizeJitterTrigger === "pressure") {
            // pressure 0 → size * 0, pressure 1 → size * 2  (clamped later)
            newSize = size * (pressure * 2);
        }

        const jitter = newSize * this.config.sizeJitter;
        newSize = clamp(randomRound(newSize - jitter, newSize), 0, newSize);

        // Hard floor
        const floor = size * this.config.minDiameter;
        if (newSize < floor) newSize = floor;

        return newSize;
    }

    private changeAngle(angle: number, pressure: number): number {
        let newAngle = angle;
        const full = Math.PI * 2;

        if (this.config.angleJitterTrigger === "pressure") {
            // Pressure < 0.5 → rotate forward, > 0.5 → rotate back
            if (pressure <= 0.5) {
                newAngle = (newAngle + full * (0.5 - pressure)) % full;
            } else {
                newAngle = (newAngle - full * (pressure - 0.5)) % full;
            }
        }

        const jitter = full * this.config.angleJitter;
        newAngle = randomRound(newAngle - jitter, newAngle + jitter, 100) % full;
        return newAngle;
    }

    private changeRoundness(roundness: number, pressure: number): number {
        let newRoundness = roundness;

        if (this.config.roundJitterTrigger === "pressure") {
            newRoundness = roundness * (pressure * 2);
        }

        const jitter = newRoundness * this.config.roundJitter;
        newRoundness = clamp(
            randomRound(newRoundness - jitter, newRoundness, 100),
            0,
            newRoundness
        );

        if (newRoundness < this.config.minRoundness) {
            newRoundness = this.config.minRoundness;
        }

        return newRoundness;
    }

    // ─── Module hook ──────────────────────────────────────

    /**
     * Called by Brush for every stamp.
     * Mutates the per-stamp config copy in place.
     */
    onChangeConfig(config: BrushBasicConfig, pressure: number): void {
        config.size = this.changeSize(config.size, pressure);
        config.angle = this.changeAngle(config.angle, pressure);
        config.roundness = this.changeRoundness(config.roundness, pressure);
    }
}