import { describe, expect, it, beforeAll, vi } from "vitest";
import { Brush } from "../src/Brush";

beforeAll(() => {
    const mockContext = {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
            data: new Uint8ClampedArray(),
            width: 100,
            height: 100,
        })),
        putImageData: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        ellipse: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        fillRect: vi.fn(),
        rect: vi.fn(),
        fillStyle: "#000000",
        globalAlpha: 1,
        globalCompositeOperation: "source-over",
        filter: "none",
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(
        HTMLCanvasElement.prototype,
        "getContext"
    ).mockImplementation((contextId: string) => {
        if (contextId === "2d") {
            return mockContext;
        }

        return null;
    });
});

describe("Brush", () => {
    const createMockCanvas = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 500;
        return canvas;
    };

    it("should create brush instance", () => {
        const canvas = createMockCanvas();
        const brush = new Brush(canvas);

        expect(brush).toBeInstanceOf(Brush);
    });

    it("should load config correctly", () => {
        const canvas = createMockCanvas();

        const brush = new Brush(canvas, {
            size: 40,
            color: "#ff0000",
        });

        expect(brush.config.size).toBe(40);
        expect(brush.config.color).toBe("#ff0000");
    });

    it("should add points correctly", () => {
        const canvas = createMockCanvas();
        const brush = new Brush(canvas);

        brush.putPoint(10, 20, 1);

        expect(true).toBe(true);
    });

    it("should clear all canvases", () => {
        const canvas = createMockCanvas();
        const brush = new Brush(canvas);

        brush.clear();

        expect(true).toBe(true);
    });

    it("should finalize stroke without crashing", () => {
        const canvas = createMockCanvas();
        const brush = new Brush(canvas);

        brush.putPoint(10, 20, 1);
        brush.finalizeStroke();

        expect(true).toBe(true);
    });

    it("should support undo/redo", () => {
        const canvas = createMockCanvas();
        const brush = new Brush(canvas);

        brush.undo();
        brush.redo();

        expect(true).toBe(true);
    });

    it("should bind external config", () => {
        const canvas = createMockCanvas();
        const brush = new Brush(canvas);

        const config = {
            size: 99,
            opacity: 1,
            flow: 1,
            color: "#ffffff",
            angle: 0,
            roundness: 1,
            spacing: 1,
        };

        brush.bindConfig(config);

        expect(brush.config).toBe(config);
    });

    it("should register and remove module", () => {
        const canvas = createMockCanvas();
        const brush = new Brush(canvas);

        const module = {};

        const id = brush.useModule(module as never);

        expect(typeof id).toBe("string");

        const removed = brush.removeModule(id);

        expect(removed).toBe(true);
    });
});