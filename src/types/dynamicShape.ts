// src/types/dynamicShape.ts

export type JitterTrigger = "none" | "pressure";

export interface DynamicShapeBasicConfig {
    /**
     * Random size variation per stamp. 0 = none, 1 = full range.
     * The stamp size is randomly chosen between (size - size*jitter) and size.
     */
    sizeJitter: number;
    /**
     * When "pressure": low pressure → smaller size, high pressure → full size.
     * Applied before jitter.
     */
    sizeJitterTrigger: JitterTrigger;
    /**
     * Minimum stamp size as a fraction of the base size. 0–1.
     * Prevents stamps shrinking below this floor even with full jitter.
     */
    minDiameter: number;

    /**
     * Random angle variation per stamp, as a fraction of a full rotation (0–1).
     * 0 = none, 1 = ±360° random spin on every stamp.
     */
    angleJitter: number;
    /**
     * When "pressure": angle is shifted proportionally to pressure deviation from 0.5.
     * Applied before jitter.
     */
    angleJitterTrigger: JitterTrigger;

    /**
     * Random roundness variation per stamp. 0 = none, 1 = full range.
     * Chosen between (roundness - roundness*jitter) and roundness.
     */
    roundJitter: number;
    /**
     * When "pressure": low pressure → lower roundness (more squashed).
     * Applied before jitter.
     */
    roundJitterTrigger: JitterTrigger;
    /**
     * Minimum roundness floor. 0–1.
     * Prevents stamps becoming fully flat even with full jitter.
     */
    minRoundness: number;
}

/** Partial version used for construction / runtime updates */
export type DynamicShapeConfig = Partial<DynamicShapeBasicConfig>;