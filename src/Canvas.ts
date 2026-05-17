import Brush from "./Brush";

import type { Point } from "./types";
import type { BrushPreset } from './presets';
import PRESETS from './presets';

export interface CanvasOptions {
    canvas: HTMLCanvasElement | string
    color?: string
    size?: number
    radius?: number
    friction?: number
    opacity?: number
    eraser?: boolean
}


export class Canvas {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private brush: Brush
    private isDrawing: boolean = false
    private lastPoint: Point | null = null

    private handleResize = this.setupCanvas.bind(this)


    constructor(options: CanvasOptions) {
        // Get Canvas Element
        if (typeof options.canvas === 'string') {
            const el = document.querySelector(options.canvas);
            if (!el || !(el instanceof HTMLCanvasElement)) {
                throw new Error(`Canvas "${options.canvas}" not found.`)
            }
            this.canvas = el;
        } else {
            this.canvas = options.canvas;
        }

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context from canvas.')
        }
        this.ctx = ctx;


        // Initialize a Brush
        this.brush = new Brush({
            radius: options.radius ?? 30, // Pulling distance
            size: options.size ?? 10, // Brush size
            enabled: true,
            eraser: options.eraser ?? false // Eraser mode
        })

        // Touch Actions
        this.canvas.style.touchAction = 'none';

        // initial colours
        if (options.color) this.setColor(options.color);
        if (options.opacity !== undefined) this.setOpacity(options.opacity);
        if (options.friction !== undefined) this.setFriction(options.friction);

        // DPI Scaling
        this.setupCanvas();

        window.addEventListener('resize', this.handleResize)

        // Bind Events
        this.bindEvents();
    }

    private setupCanvas(): void {
        const ratio = window.devicePixelRatio || 1;

        const rect = this.canvas.getBoundingClientRect();

        // Save existing drawing
        const prev = document.createElement('canvas');
        prev.width = this.canvas.width;
        prev.height = this.canvas.height;

        const prevCtx = prev.getContext('2d');

        if (prevCtx) {
            prevCtx.drawImage(this.canvas, 0, 0);
        }

        // Resize
        this.canvas.width = rect.width * ratio;
        this.canvas.height = rect.height * ratio;

        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(ratio, ratio);

        // Restore drawing
        this.ctx.drawImage(
            prev,
            0,
            0,
            prev.width,
            prev.height,
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    private bindEvents(): void {
        this.canvas.addEventListener('pointerdown', this.handlePointerDown)
        this.canvas.addEventListener('pointermove', this.handlePointerMove)
        this.canvas.addEventListener('pointerup', this.handlePointerUp)

        this.canvas.addEventListener('pointerleave', this.handlePointerUp)
        this.canvas.addEventListener('pointercancel', this.handlePointerUp)
        window.addEventListener('pointerup', this.handlePointerUp)
    }

    private handlePointerDown = (
        e: PointerEvent
    ): void => {
        this.isDrawing = true;

        this.canvas.setPointerCapture(
            e.pointerId
        );

        const point =
            this.getCanvasCoords(e);

        this.brush.update(point, {
            both: true
        });

        this.lastPoint =
            this.brush.getBrushCoordinates();
    }

    private handlePointerMove = (e: PointerEvent): void => {
        if (!this.isDrawing) return;
        e.preventDefault();

        const point = this.getCanvasCoords(e);
        this.brush.update(point, { friction: this.getFriction() })
        const brushPoint = this.brush.getBrushCoordinates();

        if (this.lastPoint) {
            this.drawStroke(this.lastPoint, brushPoint);
        }

        this.lastPoint = brushPoint;
    }

    private handlePointerUp = (e: PointerEvent): void => {
        this.isDrawing = false;
        this.lastPoint = null;
        if (this.canvas.hasPointerCapture(e.pointerId)) {
            this.canvas.releasePointerCapture(e.pointerId);
        }
    }

    private getCanvasCoords(e: PointerEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }


    private drawStroke(
        from: Point,
        to: Point
    ): void {
        const size = this.brush.getSize();

        // USE BRUSH ENGINE
        const spacing =
            this.brush.calculateSpacing(
                size,
                this.getOpacity()
            );

        const points =
            this.brush.interpolatePoints(
                from,
                to,
                spacing
            );

        // USE BRUSH ENGINE
        const opacity =
            this.brush.calculateOpacity(
                this.getOpacity()
            );

        for (const point of points) {
            this.renderPoint(
                point,
                opacity
            );
        }
    }

    private renderPoint(
        point: Point,
        opacity: number
    ): void {
        const size = this.brush.getSize();
        const isErasing = this.brush.isErasing();

        this.ctx.save();

        this.ctx.globalCompositeOperation =
            isErasing
                ? 'destination-out'
                : 'source-over';

        this.ctx.globalAlpha = opacity;

        this.ctx.fillStyle = isErasing
            ? 'rgba(0,0,0,1)'
            : this.getColor();

        this.ctx.beginPath();

        this.ctx.arc(
            point.x,
            point.y,
            size / 2,
            0,
            Math.PI * 2
        );

        this.ctx.fill();

        this.ctx.restore();
    }

    // =========================
    // Preset API
    // =========================

    /**
     * Apply a brush preset (pencil, marker, watercolor, etc.)
     * This will override the current brush settings with the preset values.
     * @param preset - Name of the preset to apply
     * @example
     * canvas.applyPreset('watercolor')
     * canvas.applyPreset('pencil')
     * canvas.applyPreset('airbrush')
    */

    applyPreset(preset: BrushPreset): void {
        const config = PRESETS[preset]
        if (!config) {
            console.warn(`Unknown preset: ${preset}`)
            return
        }

        // Apply preset values to the brush
        this.brush.setRadius(config.radius)
        this.brush.setSize(config.size)
        this.brush.setSpacing(config.spacingMin, config.spacingMax)

        if (config.densityCompensation) {
            this.brush.enableDensityCompensation()
        } else {
            this.brush.disableDensityCompensation()
        }

        // Also update the Canvas-level friction
        this.setFriction(config.friction)
    }


    // =========================
    // Public API
    // =========================

    private _color: string = '#000000';
    private _opacity: number = 1;
    private _friction: number = 0;

    setColor(color: string): void {
        this._color = color;
    }

    getColor(): string {
        return this._color
    }

    setOpacity(opacity: number): void {
        this._opacity = Math.min(1, Math.max(0, opacity))
    }

    getOpacity(): number {
        return this._opacity
    }

    setFriction(friction: number): void {
        this._friction = Math.min(0.9, Math.max(0, friction))
    }

    setSize(size: number): void {
        this.brush.setSize(size)
    }

    getSize(): number {
        return this.brush.getSize()
    }

    setRadius(radius: number): void {
        this.brush.setRadius(radius)
    }

    getRadius(): number {
        return this.brush.getRadius()
    }

    getFriction(): number {
        return this._friction
    }

    enableEraser(): void {
        this.brush.enableEraser()
    }

    disableEraser(): void {
        this.brush.disableEraser()
    }

    toggleEraser(): void {
        this.brush.toggleEraser()
    }

    resize(): void {
        this.setupCanvas()
    }

    isErasing(): boolean {
        return this.brush.isErasing()
    }

    /**
 * Get list of all available preset names
 * @returns Array of preset names
 */
    getAvailablePresets(): BrushPreset[] {
        return Object.keys(PRESETS) as BrushPreset[]
    }

    /**
     * Get the current preset configuration (or closest match)
     * Note: This returns the preset values, not necessarily the current settings
     */
    getPresetConfig(preset: BrushPreset): typeof PRESETS[BrushPreset] | undefined {
        return PRESETS[preset]
    }

    clear(): void {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
        this.ctx.restore();
    }

    destroy(): void {
        this.isDrawing = false;
        this.lastPoint = null;
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown)
        this.canvas.removeEventListener('pointermove', this.handlePointerMove)
        this.canvas.removeEventListener('pointerup', this.handlePointerUp)
        this.canvas.removeEventListener('pointerleave', this.handlePointerUp)
        this.canvas.removeEventListener('pointercancel', this.handlePointerUp)
        window.removeEventListener('pointerup', this.handlePointerUp)
        window.removeEventListener('resize', this.handleResize)
    }
}