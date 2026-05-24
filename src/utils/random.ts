// src/utils/random.ts

/**
 * Returns a random float uniformly distributed between [min, max].
 */
export function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random value between [min, max], snapped to a grid of `steps` divisions.
 *
 * @param min   Lower bound (inclusive)
 * @param max   Upper bound (inclusive)
 * @param steps Number of discrete steps across the range (default 10).
 *              Higher = smoother distribution, lower = more coarse jumps.
 *
 * @example
 * randomRound(0, 1, 10)  // one of: 0, 0.1, 0.2, … 1.0
 * randomRound(5, 10)     // integer-ish random between 5 and 10
 */
export function randomRound(min: number, max: number, steps: number = 10): number {
    if (min === max) return min;
    if (steps <= 0) return min;

    const step = (max - min) / steps;
    const raw = Math.round(random(min, max) / step) * step;
    return Math.min(Math.max(raw, min), max);
}


/**
 * Returns a random value from a normal (Gaussian) distribution
 * centred on `mean` with the given standard deviation.
 *
 * Uses the Box–Muller transform.
 *
 * @param mean   Centre of the distribution
 * @param stdDev Standard deviation (spread). Larger = wider scatter.
 */
export function randomND(mean: number, stdDev: number): number {
    // Box–Muller: produces a standard normal, then scale + shift
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1 === 0 ? 1e-10 : u1)) *
        Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
}