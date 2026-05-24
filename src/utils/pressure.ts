// src/utils/pressure.ts

interface MPPoint {
    x: number;
    y: number;
    pressure: number;
}

/**
 * Mouse pen pressure simulation.
 *
 * When you move the mouse faster, pressure decreases.
 * When you move slower, pressure increases.
 *
 * @param k        Sensitivity of speed-to-pressure mapping (default 3)
 * @param minRange Pixel distance considered "slow" → pressure rises (default 10)
 * @param maxRange Pixel distance considered "fast" → pressure falls (default 100)
 */
export class MousePressure {
    private readonly MIDDLE_PRESSURE = 0.5;
    private readonly MAX_PRESSURE = 0.8;
    private readonly MIN_PRESSURE = 0.2;
    private readonly STEP = 0.01;

    private K: number;
    private minRange: number;
    private maxRange: number;

    private _status = false;
    private prePoint?: MPPoint;

    constructor(k = 3, minRange = 10, maxRange = 100) {
        this.K = k;
        this.minRange = minRange;
        this.maxRange = maxRange;
        this._status = true;
    }

    getPressure(x: number, y: number): number {
        if (!this._status) return this.MIDDLE_PRESSURE;

        if (!this.prePoint) {
            this.prePoint = { x, y, pressure: this.MIDDLE_PRESSURE };
            return this.MIDDLE_PRESSURE;
        }

        const distance = Math.sqrt(
            (x - this.prePoint.x) ** 2 +
            (y - this.prePoint.y) ** 2
        );

        let range = this.prePoint.pressure;

        const t = 1 + (10 - 1) * (1 - Math.exp(-this.K * distance));

        if (distance < this.minRange) {
            range += this.STEP * t;
        } else if (distance > this.maxRange) {
            range -= this.STEP * t;
        } else {
            if (range < this.MIDDLE_PRESSURE) range += this.STEP * t;
            else if (range > this.MIDDLE_PRESSURE) range -= this.STEP * t;
        }

        range = Math.min(this.MAX_PRESSURE, Math.max(this.MIN_PRESSURE, range));

        this.prePoint = { x, y, pressure: range };
        return range;
    }

    /** Call this after every stroke ends */
    reset() {
        this.prePoint = void 0;
    }

    close() { this._status = false; this.reset(); }
    open() { this._status = true; this.reset(); }
    status() { return this._status; }
}