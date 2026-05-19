// src/utils/ease.ts

/**
 * Circular easing curve.
 *
 * Input range:
 * 0 → 1
 *
 * Output range:
 * 0 → 1
 */

const clamp01 = (value: number): number => {
    if (value <= 0) return 0;
    if (value >= 1) return 1;

    return value;
};

export const ease = (
    x: number
): number => {
    x = clamp01(x);

    return 1 - Math.sqrt(1 - x * x);
};