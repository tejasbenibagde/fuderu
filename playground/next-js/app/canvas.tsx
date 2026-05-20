"use client";

import { useEffect, useRef } from "react";

import { Canvas as FuderuCanvas } from "fuderu";

import { useBrushStore } from "@/components/playground/brush-store";

const Canvas = () => {
    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const canvasEngineRef =
        useRef<FuderuCanvas | null>(null);

    const {
        size,
        opacity,
        color,
        eraser,
        clearTrigger,
    } = useBrushStore();

    // =========================
    // Create Engine
    // =========================

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine =
            new FuderuCanvas({
                canvas: canvasRef.current,

                brush: {
                    size,
                    opacity,
                    color,
                    spacing: 0.5,
                    flow: 1,
                    roundness: 1,
                    angle: 0,
                },
            });

        canvasEngineRef.current = engine;

        return () => {
            engine.destroy();
        };
    }, []);

    // =========================
    // Reactive Updates
    // =========================

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.loadConfig({
            size,
        });
    }, [size]);

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.loadConfig({
            opacity,
        });
    }, [opacity]);

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.loadConfig({
            color,
        });
    }, [color]);

    // =========================
    // Eraser
    // =========================

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.brush.blendMode =
            eraser
                ? "destination-out"
                : "source-over";
    }, [eraser]);

    // =========================
    // Clear
    // =========================

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.clear();
    }, [clearTrigger]);

    return (
        <div className="flex-1 bg-muted/30 p-6">
            <canvas
                ref={canvasRef}
                className="h-full w-full rounded-2xl border border-dashed bg-background touch-none"
            />
        </div>
    );
};

export default Canvas;