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
