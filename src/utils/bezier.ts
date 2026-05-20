// src/utils/bezier.ts

import type { Vec2 } from "../types/point";

// Important Note:- This file may be moved in different language like Rust for faster performance

/* -------------------------------------------------------------------------- */
/*                                   Types                                   */
/* -------------------------------------------------------------------------- */


const EPSILON = 1e-6;
const DEFAULT_SEGMENTS = 100;

/* -------------------------------------------------------------------------- */
/*                                Math Helpers                                */
/* -------------------------------------------------------------------------- */

const clamp01 = (value: number): number => {
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
};

const distance = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
};

const distanceSquared = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;

    return dx * dx + dy * dy;
};

/* -------------------------------------------------------------------------- */
/*                            Quadratic Bezier Eval                           */
/* -------------------------------------------------------------------------- */

/**
 * Evaluate a quadratic bezier at t.
 */
export const quadraticBezier = (
    t: number,
    p1x: number,
    p1y: number,
    ptx: number,
    pty: number,
    p2x: number,
    p2y: number
): Vec2 => {
    t = clamp01(t);

    const mt = 1 - t;

    const mt2 = mt * mt;
    const t2 = t * t;

    return {
        x: mt2 * p1x + 2 * mt * t * ptx + t2 * p2x,
        y: mt2 * p1y + 2 * mt * t * pty + t2 * p2y,
    };
};

/* -------------------------------------------------------------------------- */
/*                              Curve Length API                              */
/* -------------------------------------------------------------------------- */

/**
 * Approximate quadratic bezier arc length.
 *
 * Supports partial curve evaluation via maxT.
 */
export const getQuadraticBezierDistance = (
    p1x: number,
    p1y: number,
    ptx: number,
    pty: number,
    p2x: number,
    p2y: number,
    numSegments: number = DEFAULT_SEGMENTS,
    maxT: number = 1
): number => {
    if (numSegments <= 0) {
        return 0;
    }

    maxT = clamp01(maxT);

    let length = 0;

    let prevX = p1x;
    let prevY = p1y;

    for (let i = 1; i <= numSegments; i++) {
        const t = (i / numSegments) * maxT;

        const point = quadraticBezier(
            t,
            p1x,
            p1y,
            ptx,
            pty,
            p2x,
            p2y
        );

        length += distance(prevX, prevY, point.x, point.y);

        prevX = point.x;
        prevY = point.y;
    }

    return length;
};

/* -------------------------------------------------------------------------- */
/*                        Equidistant Point Generation                        */
/* -------------------------------------------------------------------------- */

/**
 * Generate approximately equidistant points along a quadratic bezier.
 *
 * Uses fixed segment traversal instead of unstable incremental t stepping.
 */
export const getEquidistantBezierPoints = (
    p1x: number,
    p1y: number,
    ptx: number,
    pty: number,
    p2x: number,
    p2y: number,
    space: number,
    segments: number = 200
): Vec2[] => {
    if (space <= EPSILON) {
        return [];
    }

    const points: Vec2[] = [];

    const totalLength = getQuadraticBezierDistance(
        p1x,
        p1y,
        ptx,
        pty,
        p2x,
        p2y,
        segments
    );

    if (totalLength <= EPSILON) {
        return [];
    }

    const spacingSq = space * space;

    let prevX = p1x;
    let prevY = p1y;

    let accumulated = 0;

    for (let i = 1; i <= segments; i++) {
        const t = i / segments;

        const point = quadraticBezier(
            t,
            p1x,
            p1y,
            ptx,
            pty,
            p2x,
            p2y
        );

        const segmentLength = distance(
            prevX,
            prevY,
            point.x,
            point.y
        );

        accumulated += segmentLength;

        if (accumulated >= space) {
            const lastPoint =
                points.length > 0
                    ? points[points.length - 1]
                    : { x: p1x, y: p1y };

            if (
                distanceSquared(
                    lastPoint.x,
                    lastPoint.y,
                    point.x,
                    point.y
                ) >= spacingSq
            ) {
                points.push(point);
                accumulated = 0;
            }
        }

        prevX = point.x;
        prevY = point.y;
    }

    return points;
};

/* -------------------------------------------------------------------------- */
/*                             Control Point Utils                            */
/* -------------------------------------------------------------------------- */

/**
 * Get single smooth control point.
 */
export const getControlPoint = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number,
    ratio: number = 0.25
): Vec2 => {
    return {
        x: p2x + (p1x - p3x) * ratio,
        y: p2y + (p1y - p3y) * ratio,
    };
};

/**
 * Get both control points.
 */
export const getAllControlPoint = (
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number,
    ratio: number = 0.25
): [Vec2, Vec2] => {
    return [
        {
            x: p2x + (p1x - p3x) * ratio,
            y: p2y + (p1y - p3y) * ratio,
        },
        {
            x: p1x - (p1x - p2x) * ratio,
            y: p1y - (p1y - p2y) * ratio,
        },
    ];
};

/* -------------------------------------------------------------------------- */
/*                         Arc-Length Parameter Solver                        */
/* -------------------------------------------------------------------------- */

/**
 * Find t value corresponding to target arc length.
 *
 * Uses binary search on partial arc length.
 */
export const findTForLength = (
    p1x: number,
    p1y: number,
    ptx: number,
    pty: number,
    p2x: number,
    p2y: number,
    targetLength: number,
    tolerance: number = 0.001,
    segments: number = DEFAULT_SEGMENTS
): number => {
    const totalLength = getQuadraticBezierDistance(
        p1x,
        p1y,
        ptx,
        pty,
        p2x,
        p2y,
        segments
    );

    if (targetLength <= 0) {
        return 0;
    }

    if (targetLength >= totalLength) {
        return 1;
    }

    let low = 0;
    let high = 1;
    let mid = 0.5;

    while (high - low > tolerance) {
        mid = (low + high) * 0.5;

        const length = getQuadraticBezierDistance(
            p1x,
            p1y,
            ptx,
            pty,
            p2x,
            p2y,
            segments,
            mid
        );

        if (length < targetLength) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return mid;
};