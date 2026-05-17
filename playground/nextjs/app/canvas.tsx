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
        radius,
        friction,
        opacity,
        color,
        eraser,
        clearTrigger,
    } = useBrushStore();

    // =========================
    // Create Canvas Engine Once
    // =========================

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine =
            new FuderuCanvas({
                canvas: canvasRef.current,

                size,
                radius,
                friction,
                opacity,
                color,
                eraser,
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

        engine.setSize(size);
    }, [size]);

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.setRadius(radius);
    }, [radius]);

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.setFriction(friction);
    }, [friction]);

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.setOpacity(opacity);
    }, [opacity]);

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        engine.setColor(color);
    }, [color]);

    useEffect(() => {
        const engine =
            canvasEngineRef.current;

        if (!engine) return;

        if (eraser) {
            engine.enableEraser();
        } else {
            engine.disableEraser();
        }
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