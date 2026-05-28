// src/utils/opacity.ts

/**
 * Applies a stroke-level opacity ceiling to a canvas context.
 *
 * Flow accumulates per-stamp on strokeCanvas (that's intentional).
 * Opacity is a hard ceiling applied once when transferring the whole
 * stroke to the visible canvas — independent of stamp count or spacing.
 *
 * @param ctx     The context to configure (transferContext)
 * @param opacity 0.0–1.0 stroke opacity ceiling
 */
export function applyStrokeOpacity(
  ctx: CanvasRenderingContext2D,
  opacity: number,
): void {
  ctx.globalAlpha = Math.min(1, Math.max(0, opacity));
}

/**
 * Resets a context's globalAlpha to fully opaque.
 *
 * Call this after compositing to avoid leaking opacity
 * state into subsequent draw operations on the same context.
 */
export function resetOpacity(ctx: CanvasRenderingContext2D): void {
  ctx.globalAlpha = 1;
}
