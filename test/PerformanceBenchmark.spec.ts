import { describe, expect, it, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";

describe("Performance Benchmarking Suite", () => {
  let canvasEl: HTMLCanvasElement;

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function (this: HTMLCanvasElement, contextId: string) {
        if (contextId === "2d") {
          return {
            canvas: this,
            globalAlpha: 1,
            globalCompositeOperation: "source-over",
            fillStyle: "#000000",
            scale: () => {},
            setTransform: () => {},
            clearRect: () => {},
            drawImage: () => {},
            fillRect: () => {},
            getImageData: (_x: number, _y: number, w: number, h: number) => ({
              data: new Uint8ClampedArray(w * h * 4),
              width: w,
              height: h,
            }),
            putImageData: () => {},
            save: () => {},
            restore: () => {},
            beginPath: () => {},
            closePath: () => {},
            fill: () => {},
            stroke: () => {},
            rect: () => {},
            ellipse: () => {},
            moveTo: () => {},
            lineTo: () => {},
            fillText: () => {},
            measureText: () => ({ width: 50 }),
            translate: () => {},
            rotate: () => {},
          } as unknown as CanvasRenderingContext2D;
        }
        return null;
      },
    );

    canvasEl = document.createElement("canvas");
    canvasEl.width = 1920;
    canvasEl.height = 1080;
  });

  it("profiles high-frequency stroke event capture throughput (>10,000 points/sec)", () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 1920, height: 1080 },
    });

    const pointCount = 1000;
    const startTime = performance.now();

    for (let i = 0; i < pointCount; i++) {
      painter.brush.putPoint(
        (i * 1.5) % 1920,
        (i * 0.8) % 1080,
        0.5 + 0.5 * Math.sin(i / 10),
      );
    }

    const durationMs = performance.now() - startTime;
    const pointsPerSecond = (pointCount / durationMs) * 1000;

    // Performance target: processing 1,000 points should take well under 100ms
    expect(durationMs).toBeLessThan(100);
    expect(pointsPerSecond).toBeGreaterThan(10000);
  });

  it("benchmarks high layer-count compositing and rendering (30 layers)", () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 1920, height: 1080 },
    });

    // Create 30 layers
    for (let i = 0; i < 29; i++) {
      painter.createLayer(`Layer ${i + 2}`);
    }

    expect(painter.getLayers().length).toBe(30);

    // Profile renderLayers compositing loop across all 30 layers
    const startRender = performance.now();
    const iterations = 50;
    for (let i = 0; i < iterations; i++) {
      painter.renderLayers();
    }
    const renderDurationMs = performance.now() - startRender;
    const avgRenderMs = renderDurationMs / iterations;

    // 50 composite passes of 30 layers should average well under 5ms per composite
    expect(avgRenderMs).toBeLessThan(5);
  });

  it("benchmarks rapid snapshot generation throughput across many layers", () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 1920, height: 1080 },
    });

    for (let i = 0; i < 19; i++) {
      painter.createLayer(`Layer ${i + 2}`);
    }

    const startSnapshot = performance.now();
    const snapshotIterations = 1000;
    for (let i = 0; i < snapshotIterations; i++) {
      const snap = painter.getSnapshot();
      expect(snap.layers.length).toBe(20);
    }
    const snapshotDurationMs = performance.now() - startSnapshot;
    const avgSnapshotMs = snapshotDurationMs / snapshotIterations;

    // Snapshotting 20 layers 1,000 times should take well under 0.1ms per snapshot
    expect(avgSnapshotMs).toBeLessThan(0.1);
  });
});
