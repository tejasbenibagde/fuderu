// src/utils/rotation.ts

export interface RotationOptions {
    mode?: "fixed" | "flow" | "random";
    offset?: number;
    jitter?: number;
    smoothing?: number;
}

export function lerpAngle(
    a: number,
    b: number,
    t: number
): number {
    let diff = b - a;

    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    return a + diff * t;
}

export function calculateRotation(
    prevX: number,
    prevY: number,
    x: number,
    y: number,
    options?: RotationOptions,
    prevAngle: number = 0
): number {

    const mode = options?.mode ?? "fixed";

    // FIXED
    if (mode === "fixed") {
        return options?.offset ?? 0;
    }

    // RANDOM
    if (mode === "random") {
        return (
            Math.random() * Math.PI * 2 +
            (options?.offset ?? 0)
        );
    }

    // FLOW
    let angle = Math.atan2(
        y - prevY,
        x - prevX
    );

    // OFFSET
    angle += options?.offset ?? 0;

    // JITTER
    if (options?.jitter) {
        angle +=
            (Math.random() - 0.5) *
            options.jitter;
    }

    // SMOOTHING
    if (options?.smoothing != null) {
        angle = lerpAngle(
            prevAngle,
            angle,
            options.smoothing
        );
    }

    return angle;
}