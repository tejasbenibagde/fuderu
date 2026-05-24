// src/types/spread.ts

export type SpreadTrigger = "none" | "pressure";

export interface SpreadBasicConfig {
    /**
     * Scatter radius as a multiplier of the brush size.
     * 0 = no scatter, 1 = stamps can appear up to (size/2) px away from the path.
     */
    spreadRange: number;
    /**
     * When "pressure": low pressure → tighter spread, high → full spread range.
     */
    spreadTrigger: SpreadTrigger;

    /**
     * Base number of stamps placed per interpolation point.
     * 1 = normal single stamp, 5 = five stamps per point.
     */
    count: number;
    /**
     * Random count variation. 0 = none, 1 = count can drop to 1.
     */
    countJitter: number;
    /**
     * When "pressure": low pressure reduces the count toward 1.
     */
    countJitterTrigger: SpreadTrigger;
}

/** Partial version used for construction / runtime updates */
export type SpreadConfig = Partial<SpreadBasicConfig>;