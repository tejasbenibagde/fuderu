import { describe, expect, it } from "vitest";
import { applyStrokeOpacity, resetOpacity } from "../../src/utils/opacity";

describe("Opacity utilities", () => {
  it("applies and clamps stroke opacity to [0, 1] on globalAlpha", () => {
    const ctx = { globalAlpha: 1 } as CanvasRenderingContext2D;

    applyStrokeOpacity(ctx, 0.45);
    expect(ctx.globalAlpha).toBe(0.45);

    applyStrokeOpacity(ctx, -0.5);
    expect(ctx.globalAlpha).toBe(0);

    applyStrokeOpacity(ctx, 1.8);
    expect(ctx.globalAlpha).toBe(1);
  });

  it("resets context globalAlpha to 1", () => {
    const ctx = { globalAlpha: 0.2 } as CanvasRenderingContext2D;

    resetOpacity(ctx);
    expect(ctx.globalAlpha).toBe(1);
  });
});
