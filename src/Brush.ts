// src/Brush.ts

import { BrushPoint } from './Point'
import { BrushOptions, BrushUpdateOptions, Point } from './types'

const RADIUS_DEFAULT = 30

/**
 * Brush - Implements a "lazy brush" or "smoothing" algorithm for drawing.
 * 
 * How it works:
 * - There are TWO points: the "pointer" (where your cursor/mouse actually is)
 *   and the "brush" (where the drawing happens).
 * - The brush trails behind the pointer, creating a smooth, natural drawing feel.
 * - The "radius" defines how far the pointer can move before the brush starts following.
 * - "Friction" makes the movement smoother by reducing the distance traveled per frame.
 * 
 * Think of it like pulling a ball on a string - the ball (brush) follows where you pull,
 * but with a delay based on how long the string is (radius).
 */
class Brush {
  /**
   * If the brush should be enabled.
   * When disabled, the brush instantly snaps to the pointer position.
   */
  _isEnabled: boolean

  /**
   * Indicates if the brush has moved in the last update cycle.
   * Useful for knowing if you need to redraw.
   */
  _hasMoved: boolean

  /**
   * The lazy radius (pulling distance).
   * Larger = brush lags further behind, creating more smoothing.
   * Smaller = brush follows more closely, more responsive.
   */
  radius: number

  /**
   * Coordinates of the pointer (cursor/mouse position).
   * This is the "target" that the brush tries to reach.
   */
  pointer: BrushPoint

  /**
   * Coordinates of the brush (actual drawing position).
   * This is where you should draw on the canvas.
   * It trails behind the pointer based on radius and friction.
   */
  brush: BrushPoint

  /**
   * The angle between pointer and brush in the last update cycle.
   * Measured in radians. 0 = right, PI/2 = down, etc.
   * Useful for directional brush effects.
   */
  angle: number

  /**
   * The distance between pointer and brush in the last update cycle.
   * How far apart the two points currently are.
   */
  distance: number

  /**
 * Enable eraser mode.
 * When enabled, the brush will erase instead of draw.
 */
  private _isErasing: boolean = false


  /**
   * Constructs a new LazyBrush.
   * 
   * @param options - Configuration options
   * @param options.radius - How far brush trails behind (default: 30)
   * @param options.enabled - Whether lazy effect is active (default: true)
   * @param options.initialPoint - Starting position for both pointer and brush
   */
  constructor(options: BrushOptions = {}) {
    const initialPoint = options.initialPoint || { x: 0, y: 0 }
    this.radius = options.radius || RADIUS_DEFAULT
    // Enabled by default unless explicitly set to false
    this._isEnabled = options.enabled === false ? false : true
    this._isErasing = options.eraser || false

    // Initialize both pointer and brush at the same starting position
    this.pointer = new BrushPoint(initialPoint.x, initialPoint.y)
    this.brush = new BrushPoint(initialPoint.x, initialPoint.y)

    this.angle = 0
    this.distance = 0
    this._hasMoved = false
  }

  /**
   * Enable lazy brush calculations.
   * After calling this, the brush will trail behind the pointer.
   */
  enable(): void {
    this._isEnabled = true
  }

  /**
   * Disable lazy brush calculations.
   * After calling this, the brush instantly snaps to the pointer position.
   * Useful for when you want direct, immediate drawing (like an eraser).
   */
  disable(): void {
    this._isEnabled = false
  }

  /**
   * Check if lazy brush is currently enabled.
   * @returns {boolean} True if enabled, false if disabled
   */
  isEnabled(): boolean {
    return this._isEnabled
  }

  /**
   * Update the radius (pulling distance).
   * @param {number} radius - New radius in pixels
   */
  setRadius(radius: number): void {
    this.radius = radius
  }

  /**
   * Return the current radius.
   * @returns {number} Current radius in pixels
   */
  getRadius(): number {
    return this.radius
  }

  /**
   * Return the brush coordinates as a simple object.
   * This is where you should actually draw on the canvas.
   * @returns {object} { x, y } coordinates
   */
  getBrushCoordinates(): Point {
    return this.brush.toObject()
  }

  /**
   * Return the pointer coordinates as a simple object.
   * This is where the cursor/mouse currently is.
   * @returns {object} { x, y } coordinates
   */
  getPointerCoordinates(): Point {
    return this.pointer.toObject()
  }

  /**
   * Return the brush as a BrushPoint instance.
   * Use this if you need advanced point operations.
   * @returns {BrushPoint} Brush point with utility methods
   */
  getBrush(): BrushPoint {
    return this.brush
  }

  /**
 * Enable eraser mode.
 * When enabled, the brush will erase instead of draw.
 * Note: The user still needs to set `ctx.globalCompositeOperation = 'destination-out'`
 * based on this flag.
 */
  enableEraser(): void {
    this._isErasing = true
  }

  /**
 * Disable eraser mode.
 * Returns to normal drawing mode.
 */
  disableEraser(): void {
    this._isErasing = false
  }

  /**
 * Toggle eraser mode on/off.
 * @returns {boolean} The new eraser state (true = erasing)
 */
  toggleEraser(): boolean {
    this._isErasing = !this._isErasing
    return this._isErasing
  }

  /**
 * Check if eraser mode is active.
 * @returns {boolean} True if eraser is enabled
 */
  isErasing(): boolean {
    return this._isErasing
  }

  /**
   * Return the pointer as a BrushPoint instance.
   * Use this if you need advanced point operations.
   * @returns {BrushPoint} Pointer point with utility methods
   */
  getPointer(): BrushPoint {
    return this.pointer
  }

  /**
   * Return the angle between pointer and brush.
   * @returns {number} Angle in radians (0 = right, PI/2 = down, PI = left, etc.)
   */
  getAngle(): number {
    return this.angle
  }

  /**
   * Return the distance between pointer and brush.
   * @returns {number} Distance in pixels
   */
  getDistance(): number {
    return this.distance
  }

  /**
   * Return if the previous update has moved the brush.
   * Useful for skipping rendering when nothing changed.
   * @returns {boolean} Whether the brush moved previously
   */
  brushHasMoved(): boolean {
    return this._hasMoved
  }

  /**
   * Updates the pointer point and calculates the new brush point.
   * This is the core algorithm - call this whenever the mouse/cursor moves.
   * 
   * @param newPointerPoint - Where the cursor/mouse is now
   * @param options - Update options
   * @param options.both - If true, instantly moves both pointer AND brush together
   * @param options.friction - Smoothing factor (0-1). Lower = smoother but more lag.
   * @returns {boolean} True if brush position changed, false otherwise
   * 
   * Algorithm explanation:
   * 1. Update pointer to new position
   * 2. If disabled, snap brush to pointer immediately
   * 3. If enabled, calculate distance between pointer and brush
   * 4. If distance > radius, move brush towards pointer by (distance - radius)
   * 5. Apply friction to make movement smoother
   */
  update(
    newPointerPoint: Point,
    options: BrushUpdateOptions = {}
  ): boolean {
    // Reset movement flag for this update cycle
    this._hasMoved = false

    // Early exit: if pointer didn't move AND no special options, nothing to do
    if (
      this.pointer.equalsTo(newPointerPoint) &&
      !options.both &&
      !options.friction
    ) {
      return false
    }

    // Step 1: Update pointer position
    this.pointer.update(newPointerPoint)

    // Special case: "both" option moves pointer AND brush together instantly
    // Useful for teleporting the brush without drawing a line
    if (options.both) {
      this._hasMoved = true
      this.brush.update(newPointerPoint)
      return true
    }

    if (this._isEnabled) {
      // Step 2: Calculate how far and at what angle the brush is from pointer
      this.distance = this.pointer.getDistanceTo(this.brush)
      this.angle = this.pointer.getAngleTo(this.brush)

      // Step 3: Check if pointer is outside the "lazy radius"
      // Rounding avoids floating-point jitter
      const isOutside = Math.round((this.distance - this.radius) * 10) / 10 > 0

      // Validate friction value (must be between 0 and 1)
      const friction =
        options.friction && options.friction < 1 && options.friction > 0
          ? options.friction
          : undefined

      // Step 4: If pointer is outside radius, move brush closer
      if (isOutside) {
        // Move brush by the excess distance (distance - radius)
        // Direction is towards the pointer (using the calculated angle)
        this.brush.moveByAngle(
          this.angle,
          this.distance - this.radius,
          friction
        )
        this._hasMoved = true
      }
    } else {
      // Disabled mode: brush instantly snaps to pointer
      // No delay, no smoothing - direct drawing
      this.distance = 0
      this.angle = 0
      this.brush.update(newPointerPoint)
      this._hasMoved = true
    }

    return true
  }
}

export default Brush