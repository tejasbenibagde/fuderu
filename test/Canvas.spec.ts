import { describe, expect, it, beforeAll, vi } from "vitest";
import { Canvas } from "../src/Canvas";

const mockBrushInstance = {
    putPoint: vi.fn(),
    render: vi.fn(),
    finalizeStroke: vi.fn(),
    clear: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    loadConfig: vi.fn(),
    loadImageAsync: vi.fn(),
};

vi.mock("../src/Brush", () => {
    return {
        Brush: vi.fn(function () {
            return mockBrushInstance;
        }),
    };
});

beforeAll(() => {
    vi.spyOn(
        HTMLCanvasElement.prototype,
        "getContext"
    ).mockImplementation(function (
        contextId: string
    ) {
        if (contextId === "2d") {
            return {
                scale: vi.fn(),
                clearRect: vi.fn(),
                drawImage: vi.fn(),
                getImageData: vi.fn(() => ({
                    data: [],
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
                globalAlpha: 1,
                globalCompositeOperation: "source-over",
                filter: "none",
                fillStyle: "#000000",
            } as unknown as CanvasRenderingContext2D;
        }

        return null;
    });

    vi.spyOn(
        HTMLCanvasElement.prototype,
        "getBoundingClientRect"
    ).mockImplementation(function () {
        return {
            width: 500,
            height: 500,
            top: 0,
            left: 0,
            right: 500,
            bottom: 500,
            x: 0,
            y: 0,
            toJSON: () => { },
        };
    });
});

describe("Canvas", () => {
    const createCanvas = () => {
        const canvas = document.createElement("canvas");

        document.body.appendChild(canvas);

        return canvas;
    };

    it("should create canvas instance", () => {
        const canvas = createCanvas();

        const instance = new Canvas({
            canvas,
        });

        expect(instance).toBeInstanceOf(Canvas);
    });

    it("should accept selector string", () => {
        const canvas = createCanvas();

        canvas.id = "my-canvas";

        const instance = new Canvas({
            canvas: "#my-canvas",
        });

        expect(instance).toBeInstanceOf(Canvas);
    });

    it("should throw if selector does not exist", () => {
        expect(() => {
            new Canvas({
                canvas: "#missing",
            });
        }).toThrow();
    });

    it("should resize canvas correctly", () => {
        const canvas = createCanvas();

        new Canvas({
            canvas,
        });

        expect(canvas.width).toBe(500);
        expect(canvas.height).toBe(500);
    });

    it("should expose clear method", () => {
        const canvas = createCanvas();

        const instance = new Canvas({
            canvas,
        });

        instance.clear();

        expect(mockBrushInstance.clear).toHaveBeenCalled();
    });

    it("should expose undo/redo methods", () => {
        const canvas = createCanvas();

        const instance = new Canvas({
            canvas,
        });

        instance.undo();
        instance.redo();

        expect(mockBrushInstance.undo).toHaveBeenCalled();
        expect(mockBrushInstance.redo).toHaveBeenCalled();
    });

    it("should expose loadConfig method", () => {
        const canvas = createCanvas();

        const instance = new Canvas({
            canvas,
        });

        const config = {
            size: 50,
            opacity: 1,
            flow: 1,
            color: "#fff",
            angle: 0,
            roundness: 1,
            spacing: 1,
        };

        instance.loadConfig(config);

        expect(
            mockBrushInstance.loadConfig
        ).toHaveBeenCalledWith(config);
    });

    it("should destroy event listeners safely", () => {
        const canvas = createCanvas();

        const instance = new Canvas({
            canvas,
        });

        expect(() => {
            instance.destroy();
        }).not.toThrow();
    });

    it("should handle pointer events", () => {
        const canvas = createCanvas();

        new Canvas({
            canvas,
        });

        canvas.dispatchEvent(
            new PointerEvent("pointerdown", {
                clientX: 100,
                clientY: 100,
                pressure: 1,
            })
        );

        canvas.dispatchEvent(
            new PointerEvent("pointermove", {
                clientX: 120,
                clientY: 120,
                pressure: 1,
            })
        );

        window.dispatchEvent(
            new PointerEvent("pointerup")
        );

        expect(
            mockBrushInstance.putPoint
        ).toHaveBeenCalled();

        expect(
            mockBrushInstance.render
        ).toHaveBeenCalled();

        expect(
            mockBrushInstance.finalizeStroke
        ).toHaveBeenCalled();
    });
});