// src/types/pattern.ts

export interface PatternBasicConfig {
    /**
     * Scale multiplier for the pattern tile. 1 = original size, 2 = double, 0.5 = half.
     */
    scale: number;
    /**
     * CSS brightness adjustment in percent. 0 = no change, 50 = +50%, -50 = -50%.
     */
    brightness: number;
    /**
     * CSS contrast adjustment in percent. 0 = no change, 50 = +50%.
     */
    contrast: number;
    /**
     * Canvas composite operation used when blending the pattern over the stroke.
     * "source-over" = normal, "multiply" = darken, etc.
     */
    blendMode: CanvasRenderingContext2D["globalCompositeOperation"];
}

/** Partial version used for construction / runtime updates */
export type PatternConfig = Partial<PatternBasicConfig>;