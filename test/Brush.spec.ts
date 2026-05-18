import { describe, expect, it, beforeEach } from 'vitest'
import Brush from '../src/Brush'

describe('Brush', () => {
  let brush: Brush

  beforeEach(() => {
    brush = new Brush({ radius: 30, enabled: true })
  })

  describe('Eraser functionality', () => {
    it('Should initialize with eraser mode disabled by default', () => {
      expect(brush.isErasing()).toBe(false)
    })

    it('Should initialize with eraser mode enabled when option is passed', () => {
      const eraserBrush = new Brush({ radius: 30, enabled: true, eraser: true })
      expect(eraserBrush.isErasing()).toBe(true)
    })

    it('Should enable eraser mode when enableEraser() is called', () => {
      brush.enableEraser()
      expect(brush.isErasing()).toBe(true)
    })

    it('Should disable eraser mode when disableEraser() is called', () => {
      brush.enableEraser()
      expect(brush.isErasing()).toBe(true)

      brush.disableEraser()
      expect(brush.isErasing()).toBe(false)
    })

    it('Should toggle eraser mode on/off with toggleEraser()', () => {
      // Start disabled
      expect(brush.isErasing()).toBe(false)

      // First toggle - should enable
      const result1 = brush.toggleEraser()
      expect(result1).toBe(true)
      expect(brush.isErasing()).toBe(true)

      // Second toggle - should disable
      const result2 = brush.toggleEraser()
      expect(result2).toBe(false)
      expect(brush.isErasing()).toBe(false)

      // Third toggle - should enable again
      const result3 = brush.toggleEraser()
      expect(result3).toBe(true)
      expect(brush.isErasing()).toBe(true)
    })

    it('Should maintain brush position tracking independently of eraser mode', () => {
      const initialPoint = { x: 100, y: 100 }
      const brushWithErase = new Brush({
        radius: 30,
        enabled: true,
        initialPoint,
        eraser: true
      })

      // Eraser enabled but position should still work
      expect(brushWithErase.isErasing()).toBe(true)

      const brushPos = brushWithErase.getBrushCoordinates()
      expect(brushPos.x).toBeCloseTo(100)
      expect(brushPos.y).toBeCloseTo(100)

      // Update position
      brushWithErase.update({ x: 200, y: 200 })
      const newBrushPos = brushWithErase.getBrushCoordinates()
      // Brush position should have moved (lazy effect applies)
      expect(newBrushPos.x).toBeGreaterThan(100)
    })

    it('Should preserve radius and friction settings when toggling eraser', () => {
      brush.setRadius(50)
      expect(brush.getRadius()).toBe(50)
      expect(brush.isErasing()).toBe(false)

      brush.toggleEraser()
      expect(brush.isErasing()).toBe(true)
      expect(brush.getRadius()).toBe(50) // Radius unchanged

      brush.toggleEraser()
      expect(brush.isErasing()).toBe(false)
      expect(brush.getRadius()).toBe(50) // Still unchanged
    })

    it('Should preserve enabled/disabled state when toggling eraser', () => {
      brush.disable()
      expect(brush.isEnabled()).toBe(false)

      brush.toggleEraser()
      expect(brush.isErasing()).toBe(true)
      expect(brush.isEnabled()).toBe(false) // Enabled state unchanged

      brush.enable()
      expect(brush.isEnabled()).toBe(true)
      expect(brush.isErasing()).toBe(true) // Eraser state preserved
    })

    it('Should work correctly with multiple eraser toggles during a stroke', () => {
      // Start drawing
      brush.update({ x: 100, y: 100 }, { both: true })
      expect(brush.isErasing()).toBe(false)

      // Simulate stroke with eraser toggle
      brush.update({ x: 150, y: 150 })
      brush.toggleEraser() // Switch to eraser mid-stroke
      expect(brush.isErasing()).toBe(true)

      brush.update({ x: 200, y: 200 })
      brush.toggleEraser() // Switch back to draw
      expect(brush.isErasing()).toBe(false)

      brush.update({ x: 250, y: 250 })

      // All updates should have processed correctly
      const finalPos = brush.getBrushCoordinates()
      expect(finalPos.x).toBeGreaterThan(100)
      expect(finalPos.y).toBeGreaterThan(100)
    })
  })
})

describe('Brush radius and size', () => {
  it('Should initialize with default size', () => {
    const b = new Brush()

    expect(b.getSize()).toBe(10)
  })

  it('Should initialize with custom size', () => {
    const b = new Brush({ size: 25 })

    expect(b.getSize()).toBe(25)
  })

  it('Should update size correctly with setSize()', () => {
    const b = new Brush()

    expect(b.getSize()).toBe(10)

    b.setSize(40)

    expect(b.getSize()).toBe(40)
  })


  it('Should preserve size during brush updates', () => {
    const b = new Brush({ size: 15 })

    b.update({ x: 100, y: 100 })

    expect(b.getSize()).toBe(15)

    b.update({ x: 300, y: 300 })

    expect(b.getSize()).toBe(15)
  })


  it('Should preserve size when toggling eraser mode', () => {
    const b = new Brush({ size: 20 })

    expect(b.getSize()).toBe(20)

    b.toggleEraser()

    expect(b.getSize()).toBe(20)

    b.toggleEraser()

    expect(b.getSize()).toBe(20)
  })

  it('Should preserve size when enabling/disabling brush', () => {
    const b = new Brush({ size: 18 })

    b.disable()

    expect(b.getSize()).toBe(18)

    b.enable()

    expect(b.getSize()).toBe(18)
  })

  it('Should throw an error when setting size to 0', () => {
    const b = new Brush()

    expect(() => b.setSize(0)).toThrow(
      'Brush size must be a positive finite number'
    )
  })

  it('Should throw an error when setting a negative size', () => {
    const b = new Brush()

    expect(() => b.setSize(-10)).toThrow(
      'Brush size must be a positive finite number'
    )
  })

  it('Should throw an error when setting NaN as size', () => {
    const b = new Brush()

    expect(() => b.setSize(NaN)).toThrow(
      'Brush size must be a positive finite number'
    )
  })

  it('Should throw an error when setting Infinity as size', () => {
    const b = new Brush()

    expect(() => b.setSize(Infinity)).toThrow(
      'Brush size must be a positive finite number'
    )
  })

  it('Should fallback to default size when invalid size is provided in constructor', () => {
    const b = new Brush({ size: -20 })

    expect(b.getSize()).toBe(10)
  })

  it('Should fallback to default size when NaN is provided in constructor', () => {
    const b = new Brush({ size: NaN })

    expect(b.getSize()).toBe(10)
  })
})


describe('Brush spacing and density compensation', () => {
  let brush: Brush

  beforeEach(() => {
    brush = new Brush({
      size: 20
    })
  })

  describe('Spacing calculation', () => {
    it('Should calculate spacing based on brush size', () => {
      const spacing = brush.calculateSpacing(20)

      // 20 * 0.18 = 3.6
      expect(spacing).toBeCloseTo(3.6)
    })

    it('Should calculate spacing for large brushes', () => {
      const spacing = brush.calculateSpacing(40)

      // 40 * 0.18 = 7.2
      expect(spacing).toBeCloseTo(7.2)
    })

    it('Should calculate spacing for small brushes', () => {
      const spacing = brush.calculateSpacing(10)

      // 10 * 0.18 = 1.8
      expect(spacing).toBeCloseTo(1.8)
    })

    it('Should reduce spacing for low opacity', () => {
      const highOpacitySpacing = brush.calculateSpacing(20, 1)
      const lowOpacitySpacing = brush.calculateSpacing(20, 0.2)

      expect(lowOpacitySpacing).toBeLessThan(highOpacitySpacing)
    })
  })

  describe('Opacity calculation', () => {
    it('Should calculate adjusted opacity using spacing and density compensation', () => {
      const opacity = brush.calculateOpacity(0.5)

      expect(opacity).toBeGreaterThan(0)
      expect(opacity).toBeLessThanOrEqual(0.5)
    })
  })

  describe('Point interpolation', () => {
    it('Should interpolate points between two coordinates', () => {
      const points = brush.interpolatePoints(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        2
      )

      expect(points.length).toBeGreaterThan(1)

      expect(points[0]).toEqual({ x: 0, y: 0 })

      expect(points[points.length - 1]).toEqual({
        x: 10,
        y: 0
      })
    })

    it('Should return a single point when distance is zero', () => {
      const points = brush.interpolatePoints(
        { x: 5, y: 5 },
        { x: 5, y: 5 },
        2
      )

      expect(points).toEqual([{ x: 5, y: 5 }])
    })

    it('Should create evenly spaced interpolated points', () => {
      const points = brush.interpolatePoints(
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        5
      )

      expect(points.length).toBe(3)

      expect(points[0].x).toBeCloseTo(0)
      expect(points[1].x).toBeCloseTo(5)
      expect(points[2].x).toBeCloseTo(10)
    })

    it('Should interpolate diagonal points correctly', () => {
      const points = brush.interpolatePoints(
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        5
      )

      expect(points.length).toBeGreaterThan(1)

      expect(points[0]).toEqual({ x: 0, y: 0 })

      expect(points[points.length - 1]).toEqual({
        x: 10,
        y: 10
      })
    })
  })
})