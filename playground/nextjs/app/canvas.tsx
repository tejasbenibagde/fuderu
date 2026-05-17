"use client";

import { useEffect, useRef } from "react";

import { Brush } from "fuderu";

import { useBrushStore } from "@/components/playground/brush-store";

const Canvas = () => {
    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const brushRef = useRef<Brush | null>(null);

    const ctxRef =
        useRef<CanvasRenderingContext2D | null>(
            null
        );

    const isDrawingRef = useRef(false);

    const lastPointRef = useRef<{
        x: number;
        y: number;
    } | null>(null);

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
    // Create Brush Once
    // =========================

    useEffect(() => {
        brushRef.current = new Brush({
            radius,
            size,
            enabled: true,
            eraser,
        });
    }, []);

    // =========================
    // Reactive Brush Updates
    // =========================

    useEffect(() => {
        const brush = brushRef.current;

        if (!brush) return;

        brush.setSize(size);

        brush.setRadius(radius);

        if (eraser) {
            brush.enableEraser();
        } else {
            brush.disableEraser();
        }
    }, [size, radius, eraser]);

    // =========================
    // Canvas Setup Once
    // =========================

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        ctxRef.current = ctx;

        const resizeCanvas = () => {
            const ratio =
                window.devicePixelRatio || 1;

            canvas.width =
                canvas.offsetWidth * ratio;

            canvas.height =
                canvas.offsetHeight * ratio;

            ctx.setTransform(
                1,
                0,
                0,
                1,
                0,
                0
            );

            ctx.scale(ratio, ratio);
        };

        resizeCanvas();

        window.addEventListener(
            "resize",
            resizeCanvas
        );

        // =========================
        // Helpers
        // =========================

        const getPoint = (
            e: PointerEvent
        ) => {
            const rect =
                canvas.getBoundingClientRect();

            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        // =========================
        // Drawing
        // =========================

        const drawDot = (
            x: number,
            y: number,
            size: number,
            opacity: number
        ) => {
            const brush = brushRef.current;

            if (!brush) return;

            ctx.save();

            ctx.globalCompositeOperation =
                brush.isErasing()
                    ? "destination-out"
                    : "source-over";

            const radius = size / 2;

            // Smaller soft edge = sharper brush
            const softEdge = Math.max(radius * 0.15, 1);

            const gradient =
                ctx.createRadialGradient(
                    x,
                    y,
                    radius - softEdge,
                    x,
                    y,
                    radius
                );

            if (brush.isErasing()) {
                gradient.addColorStop(
                    0,
                    "rgba(0,0,0,1)"
                );

                gradient.addColorStop(
                    1,
                    "rgba(0,0,0,0)"
                );
            } else {
                const { color } =
                    useBrushStore.getState();

                const r = parseInt(
                    color.slice(1, 3),
                    16
                );

                const g = parseInt(
                    color.slice(3, 5),
                    16
                );

                const b = parseInt(
                    color.slice(5, 7),
                    16
                );

                // Strong center
                gradient.addColorStop(
                    0,
                    `rgba(${r},${g},${b},${opacity})`
                );

                // Slight fade near edge
                gradient.addColorStop(
                    0.8,
                    `rgba(${r},${g},${b},${opacity * 0.9})`
                );

                // Soft edge
                gradient.addColorStop(
                    1,
                    `rgba(${r},${g},${b},0)`
                );
            }

            ctx.fillStyle = gradient;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        };
        const drawStroke = (
            fromX: number,
            fromY: number,
            toX: number,
            toY: number
        ) => {
            const brush = brushRef.current;

            if (!brush) return;

            const size = brush.getSize();

            const spacing =
                brush.calculateSpacing(
                    size,
                    opacity
                );

            const points =
                brush.interpolatePoints(
                    {
                        x: fromX,
                        y: fromY,
                    },
                    {
                        x: toX,
                        y: toY,
                    },
                    spacing
                );

            for (const point of points) {
                const { opacity } = useBrushStore.getState();

                const adjustedOpacity =
                    brush.calculateOpacity(opacity);

                drawDot(
                    point.x,
                    point.y,
                    size,
                    adjustedOpacity
                );
            }
        };

        // =========================
        // Events
        // =========================

        const handlePointerDown = (
            e: PointerEvent
        ) => {
            const brush = brushRef.current;

            if (!brush) return;

            isDrawingRef.current = true;

            const point = getPoint(e);


            brush.update(point, {
                both: true,
            });
            lastPointRef.current =
                brush.getBrushCoordinates();
        };

        const handlePointerMove = (
            e: PointerEvent
        ) => {
            if (!isDrawingRef.current) return;

            e.preventDefault();

            const brush = brushRef.current;

            if (!brush) return;

            const point = getPoint(e);

            brush.update(point, {
                friction,
            });

            const brushPoint =
                brush.getBrushCoordinates();

            if (lastPointRef.current) {
                drawStroke(
                    lastPointRef.current.x,
                    lastPointRef.current.y,
                    brushPoint.x,
                    brushPoint.y
                );
            }

            lastPointRef.current =
                brushPoint;
        };

        const handlePointerUp = () => {
            isDrawingRef.current = false;

            lastPointRef.current = null;
        };

        canvas.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        canvas.addEventListener(
            "pointermove",
            handlePointerMove
        );

        window.addEventListener(
            "pointerup",
            handlePointerUp
        );

        return () => {
            window.removeEventListener(
                "resize",
                resizeCanvas
            );

            canvas.removeEventListener(
                "pointerdown",
                handlePointerDown
            );

            canvas.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            window.removeEventListener(
                "pointerup",
                handlePointerUp
            );
        };
    }, []);

    // =========================
    // Clear Canvas
    // =========================

    useEffect(() => {
        const canvas = canvasRef.current;

        const ctx = ctxRef.current;

        if (!canvas || !ctx) return;

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
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