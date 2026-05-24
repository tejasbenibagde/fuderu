// src/modules/spread.ts

import { BrushBasicConfig } from "../types/config";
import { PurePoint } from "../types/point";

import {
    SpreadBasicConfig,
    SpreadConfig,
} from "../types/spread";

import { clamp } from "../utils/math";
import { randomND, randomRound } from "../utils/random";

const defaultConfig: SpreadBasicConfig = {
    spreadRange: 0.25,
    spreadTrigger: "none",

    count: 1,

    countJitter: 0.0,
    countJitterTrigger: "none",
};

/**
 * Generates additional nearby brush points.
 *
 * Useful for:
 * - spray brushes
 * - splatter brushes
 * - foliage brushes
 * - texture brushes
 */
export class SpreadModule {
    config: SpreadBasicConfig;

    constructor(config?: SpreadConfig) {
        this.config = {
            ...defaultConfig,
            ...Object.fromEntries(
                Object.entries(config ?? {}).filter(([, v]) => v != null),
            ),
        } as SpreadBasicConfig;
    }

    bindConfig(config: SpreadBasicConfig): void {
        this.config = config;
    }

    // ─────────────────────────────────────────────

    private spread(
        size: number,
        x: number,
        y: number,
        pressure: number,
    ): PurePoint[] {

        if (this.config.spreadRange <= 0) {
            return [];
        }

        let count = this.config.count;

        if (this.config.countJitterTrigger === "pressure") {
            count -= Math.round(count * (1 - pressure * 2));
        }

        const jitter = Math.round(count * this.config.countJitter);

        count = clamp(
            randomRound(count - jitter, count),
            1,
            count,
        );

        if (count < 1) count = 1;

        if (this.config.spreadTrigger === "pressure") {
            size *= pressure * 2;
        }

        const points: PurePoint[] = [];

        for (let i = 0; i < count; i++) {
            points.push({
                x: randomND(x, (size * this.config.spreadRange) / 2),
                y: randomND(y, (size * this.config.spreadRange) / 2),
                pressure,
            });
        }

        return points;
    }

    // ─────────────────────────────────────────────

    onChangePoint(
        point: PurePoint,
        config: BrushBasicConfig,
    ): PurePoint[] {
        return [
            point,
            ...this.spread(
                config.size,
                point.x,
                point.y,
                point.pressure,
            ),
        ];
    }
}