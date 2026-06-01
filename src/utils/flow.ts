// src/utils/flow.ts
import { clamp01 } from "./math";

/**
 * Converts a user-facing flow value into the alpha used for each brush stamp.
 *
 * Dense spacing draws many stamps over the same pixels. Without normalization,
 * even a low flow value quickly accumulates to solid color. This keeps the
 * visible stroke closer to the requested flow across different spacing values.
 */
export const normalizeFlowForSpacing = (
  flow: number,
  brushSize: number,
  spacing: number,
  minSpacing: number = 0.5,
): number => {
  const targetFlow = clamp01(flow);

  if (targetFlow <= 0 || targetFlow >= 1) {
    return targetFlow;
  }

  const safeBrushSize = Math.max(0, brushSize);
  const safeSpacing = Math.max(minSpacing, spacing * safeBrushSize);

  if (safeBrushSize <= 0 || safeSpacing <= 0) {
    return targetFlow;
  }

  const expectedOverlaps = Math.max(1, (safeBrushSize * 2) / safeSpacing);

  return 1 - Math.pow(1 - targetFlow, 1 / expectedOverlaps);
};
