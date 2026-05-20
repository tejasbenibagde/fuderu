"use client";

import { useEffect, useRef } from "react";

import { Canvas as FuderuCanvas } from "fuderu";

import { useBrushStore } from "@/components/playground/brush-store";

const Canvas = () => {
    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const engineRef =
        useRef<FuderuCanvas | null>(null);

    const {
        size,
        opacity,
        color,
        spacing,
        flow,
        roundness,
        smooth,
        image,
        clearTrigger,
        undoTrigger,
        redoTrigger,
    } = useBrushStore();

    // =========================
    // Resize Canvas Properly
    // =========================

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const resize = () => {
            const rect =
                canvas.getBoundingClientRect();

            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        resize();

        window.addEventListener(
            "resize",
            resize
        );

        return () => {
            window.removeEventListener(
                "resize",
                resize
            );
        };
    }, []);

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
                    spacing,
                    flow,
                    roundness,
                },
            });

        engine.brush.isSmooth = smooth;

        engineRef.current = engine;

        return () => {
            engine.destroy();
        };
    }, []);

    // =========================
    // Reactive Brush Updates
    // =========================

    useEffect(() => {
        const engine =
            engineRef.current;

        if (!engine) return;

        engine.brush.loadConfig({
            size,
            opacity,
            color,
            spacing,
            flow,
            roundness,
        });

        engine.brush.isSmooth = smooth;
    }, [
        size,
        opacity,
        color,
        spacing,
        flow,
        roundness,
        smooth,
    ]);

    // =========================
    // Image Brush
    // =========================

    useEffect(() => {
        const engine =
            engineRef.current;

        if (!engine) return;

        if (!image) {
            engine.brush.removeImage();
            return;
        }

        engine.loadImage(image);
    }, [image]);

    // =========================
    // Clear
    // =========================

    useEffect(() => {
        engineRef.current?.clear();
    }, [clearTrigger]);

    // =========================
    // Undo
    // =========================

    useEffect(() => {
        if (undoTrigger === 0) return;

        engineRef.current?.undo();
    }, [undoTrigger]);

    // =========================
    // Redo
    // =========================

    useEffect(() => {
        if (redoTrigger === 0) return;

        engineRef.current?.redo();
    }, [redoTrigger]);

    return (
        <div className="flex-1 bg-muted/30 p-6">
            <canvas
                ref={canvasRef}
                className="h-full w-full rounded-2xl border border-dashed bg-background"
            />
        </div>
    );
};

export default Canvas;