import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Canvas } from '../src/Canvas';

type MockCanvasContext = {
    save: ReturnType<typeof vi.fn>
    restore: ReturnType<typeof vi.fn>
    scale: ReturnType<typeof vi.fn>
    setTransform: ReturnType<typeof vi.fn>
    drawImage: ReturnType<typeof vi.fn>
    clearRect: ReturnType<typeof vi.fn>
    beginPath: ReturnType<typeof vi.fn>
    arc: ReturnType<typeof vi.fn>
    fill: ReturnType<typeof vi.fn>
}

describe('Canvas', () => {
    let canvasElement: HTMLCanvasElement;
    let mockContext: MockCanvasContext;

    beforeEach(() => {
        canvasElement = document.createElement('canvas')

        canvasElement.width = 500
        canvasElement.height = 500

        mockContext = {
            save: vi.fn(),
            restore: vi.fn(),
            scale: vi.fn(),
            setTransform: vi.fn(),
            drawImage: vi.fn(),
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
        }

        vi.spyOn(
            canvasElement,
            'getContext'
        ).mockReturnValue(
            mockContext as unknown as CanvasRenderingContext2D
        )

        document.body.appendChild(canvasElement)
    })

    describe("Initialization", () => {
        it('should create a canvas instance', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            expect(canvas).toBeInstanceOf(Canvas)
        })

        it('should initialize default brush values', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            expect(canvas.getSize()).toBe(10)
            expect(canvas.getRadius()).toBe(30)
            expect(canvas.getOpacity()).toBe(1)
            expect(canvas.getColor()).toBe('#000000')
        })

        it('should initialize custom values', () => {
            const canvas = new Canvas({
                canvas: canvasElement,
                size: 20,
                radius: 50,
                opacity: 0.5,
                color: '#ff0000'
            })

            expect(canvas.getSize()).toBe(20)
            expect(canvas.getRadius()).toBe(50)
            expect(canvas.getOpacity()).toBe(0.5)
            expect(canvas.getColor()).toBe('#ff0000')
        })
    })

    describe('Color', () => {
        it('should update color', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            canvas.setColor('#00ff00')

            expect(canvas.getColor()).toBe('#00ff00')
        })
    })

    describe('Opacity', () => {
        it('should clamp opacity between 0 and 1', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            canvas.setOpacity(5)

            expect(canvas.getOpacity()).toBe(1)

            canvas.setOpacity(-1)

            expect(canvas.getOpacity()).toBe(0)
        })
    })

    describe('Friction', () => {
        it('should clamp friction between 0 and 0.9', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            canvas.setFriction(5)

            expect(canvas.getFriction()).toBe(0.9)

            canvas.setFriction(-1)

            expect(canvas.getFriction()).toBe(0)
        })
    })

    describe('Brush Controls', () => {
        it('should update brush size', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            canvas.setSize(25)

            expect(canvas.getSize()).toBe(25)
        })

        it('should update brush radius', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            canvas.setRadius(100)

            expect(canvas.getRadius()).toBe(100)
        })
    })

    describe('Eraser', () => {
        it('should enable eraser', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            canvas.enableEraser()

            expect(canvas.isErasing()).toBe(true)
        })

        it('should disable eraser', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            canvas.enableEraser()
            canvas.disableEraser()

            expect(canvas.isErasing()).toBe(false)
        })

        it('should toggle eraser', () => {
            const canvas = new Canvas({
                canvas: canvasElement
            })

            canvas.toggleEraser()

            expect(canvas.isErasing()).toBe(true)

            canvas.toggleEraser()

            expect(canvas.isErasing()).toBe(false)
        })

        describe('Canvas Operations', () => {
            it('should clear the canvas', () => {
                const canvas = new Canvas({
                    canvas: canvasElement
                })

                canvas.clear()

                expect(mockContext.clearRect).toHaveBeenCalled()
            })

            it('should resize safely', () => {
                const canvas = new Canvas({
                    canvas: canvasElement
                })

                expect(() => canvas.resize()).not.toThrow()
            })

            it('should destroy safely', () => {
                const canvas = new Canvas({
                    canvas: canvasElement
                })

                expect(() => canvas.destroy()).not.toThrow()
            })
        })
    })
});