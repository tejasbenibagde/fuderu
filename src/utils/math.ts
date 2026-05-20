// src/utils/math.ts
import { Vec2 } from "../types/point";

/* -------------------------------------------------------------------------- */
/*                                   Distance                                 */
/* -------------------------------------------------------------------------- */

/**
 * Calculate Euclidean distance between two points.
 */
export const getDistance = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number
): number => {
    const dx = p2x - p1x;
    const dy = p2y - p1y;

    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate squared distance.
 *
 * Useful when avoiding sqrt for performance.
 */
export const getDistanceSquared = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number
): number => {
    const dx = p2x - p1x;
    const dy = p2y - p1y;

    return dx * dx + dy * dy;
};

/* -------------------------------------------------------------------------- */
/*                                     Angle                                  */
/* -------------------------------------------------------------------------- */

/**
 * Angle between two points in radians.
 */
export const getAngle = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number
): number => {
    return Math.atan2(
        p2y - p1y,
        p2x - p1x
    );
};

/* -------------------------------------------------------------------------- */
/*                                Interpolation                               */
/* -------------------------------------------------------------------------- */

/**
 * Linear interpolation between two points.
 *
 * t:
 * 0 → start point
 * 1 → end point
 */
export const getPointBetween = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    t: number = 0.5
): Vec2 => {
    return {
        x: p1x + (p2x - p1x) * t,
        y: p1y + (p2y - p1y) * t,
    };
};

/* -------------------------------------------------------------------------- */
/*                               Decimal Splitter                             */
/* -------------------------------------------------------------------------- */

/**
 * Split number into repeated unit chunks.
 *
 * @example
 * splitDecimal(3.2)
 * // [1, 1, 1, 0.2]
 *
 * splitDecimal(4.1, 2)
 * // [2, 2, 0.1]
 */
export const splitDecimal = (
    num: number,
    unit: number = 1
): number[] => {
    if (
        unit <= 0 ||
        !Number.isFinite(num)
    ) {
        return [];
    }

    const result: number[] = [];

    const wholePart =
        Math.floor(num / unit);

    const decimalPart =
        Number(
            (
                num - wholePart * unit
            ).toFixed(10)
        );

    for (let i = 0; i < wholePart; i++) {
        result.push(unit);
    }

    if (decimalPart > 1e-10) {
        result.push(decimalPart);
    }

    return result;
};

/* -------------------------------------------------------------------------- */
/*                                    Clamp                                   */
/* -------------------------------------------------------------------------- */

/**
 * Clamp number between min and max.
 */
export const clamp = (
    num: number,
    min: number,
    max: number
): number => {
    return Math.min(
        Math.max(num, min),
        max
    );
};

/**
 * Clamp number between 0 and 1.
 */
export const clamp01 = (
    num: number
): number => {
    return clamp(num, 0, 1);
};

/* -------------------------------------------------------------------------- */
/*                                     Wrap                                   */
/* -------------------------------------------------------------------------- */

/**
 * Wrap number into range:
 * 0 <= value < max
 *
 * @example
 * wrap(5, 3) => 2
 * wrap(-5, 3) => 1
 * wrap(3, 3) => 0
 */
export const wrap = (
    num: number,
    max: number
): number => {
    if (max <= 0) {
        return 0;
    }

    return ((num % max) + max) % max;
};