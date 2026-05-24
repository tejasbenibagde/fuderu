// src/types/dynamicTransparency.ts

export type TransparencyJitterTrigger = "none" | "pressure";

export interface DynamicTransparencyBasicConfig {
    /**
     * Random opacity variation per stroke. 0 = none, 1 = full range.
     * Locked once per stroke — all stamps in a stroke share the same opacity roll.
     */
    opacityJitter: number;
    /**
     * When "pressure": opacity is scaled by pressure at stroke start.
     * Applied before jitter.
     */
    opacityJitterTrigger: TransparencyJitterTrigger;
    /**
     * Minimum opacity as a fraction of the base opacity. 0–1.
     */
    minOpacityJitter: number;

    /**
     * Random flow variation per stamp. 0 = none, 1 = full range.
     * Re-rolled on every stamp (unlike opacity which is per-stroke).
     */
    flowJitter: number;
    /**
     * When "pressure": flow is scaled by pressure on each stamp.
     * Applied before jitter.
     */
    flowJitterTrigger: TransparencyJitterTrigger;
    /**
     * Minimum flow as a fraction of the base flow. 0–1.
     */
    minFlowJitter: number;
}

/** Partial version used for construction / runtime updates */
export type DynamicTransparencyConfig = Partial<DynamicTransparencyBasicConfig>;