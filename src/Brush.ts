// src/Brush.ts
import { BrushPoint, Point } from './Point'

const RADIUS_DEFAULT = 30

interface BrushOptions {
  radius?: number
  enabled?: boolean
  initialPoint?: Point
}

interface BrushUpdateOptions {
  both?: boolean
  friction?: number
}

class Brush {
  /**
   * If the lazy brush should be enabled.
   */
  _isEnabled: boolean

  /**
   * Indicates if the brush has moved in the last update cycle.
   */
  _hasMoved: boolean

  /**
   * The lazy radius.
   */
  radius: number

  /**
   * Coordinates of the pointer.
   */
  pointer: BrushPoint

  /**
   * Coordinates of the brush.
   */
  brush: BrushPoint

  /**
   * The angle between pointer and brush in the last update cycle.
   */
  angle: number

  /**
   * The distance between pointer and brush in the last update cycle.
   */
  distance: number

  /**
   * Constructs a new LazyBrush.
   */
  constructor(options: BrushOptions = {}) {
    const initialPoint = options.initialPoint || { x: 0, y: 0 }
    this.radius = options.radius || RADIUS_DEFAULT
    this._isEnabled = options.enabled === false ? false : true

    this.pointer = new BrushPoint(initialPoint.x, initialPoint.y)
    this.brush = new BrushPoint(initialPoint.x, initialPoint.y)

    this.angle = 0
    this.distance = 0
    this._hasMoved = false
  }

  /**
   * Enable lazy brush calculations.
   *
   */
  enable(): void {
    this._isEnabled = true
  }

  /**
   * Disable lazy brush calculations.
   *
   */
  disable(): void {
    this._isEnabled = false
  }

  /**
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this._isEnabled
  }

  /**
   * Update the radius
   *
   * @param {number} radius
   */
  setRadius(radius: number): void {
    this.radius = radius
  }

  /**
   * Return the current radius
   *
   * @returns {number}
   */
  getRadius(): number {
    return this.radius
  }

  /**
   * Return the brush coordinates as a simple object
   *
   * @returns {object}
   */
  getBrushCoordinates(): Point {
    return this.brush.toObject()
  }

  /**
   * Return the pointer coordinates as a simple object
   *
   * @returns {object}
   */
  getPointerCoordinates(): Point {
    return this.pointer.toObject()
  }

  /**
   * Return the brush as a LazyPoint
   *
   * @returns {BrushPoint}
   */
  getBrush(): BrushPoint {
    return this.brush
  }

  /**
   * Return the pointer as a BrushPoint
   *
   * @returns {BrushPoint}
   */
  getPointer(): BrushPoint {
    return this.pointer
  }

  /**
   * Return the angle between pointer and brush
   *
   * @returns {number} Angle in radians
   */
  getAngle(): number {
    return this.angle
  }

  /**
   * Return the distance between pointer and brush
   *
   * @returns {number} Distance in pixels
   */
  getDistance(): number {
    return this.distance
  }

  /**
   * Return if the previous update has moved the brush.
   *
   * @returns {boolean} Whether the brush moved previously.
   */
  brushHasMoved(): boolean {
    return this._hasMoved
  }

  /**
   * Updates the pointer point and calculates the new brush point.
   */
  update(
    newPointerPoint: Point,
    options: BrushUpdateOptions = {}
  ): boolean {
    this._hasMoved = false
    if (
      this.pointer.equalsTo(newPointerPoint) &&
      !options.both &&
      !options.friction
    ) {
      return false
    }

    this.pointer.update(newPointerPoint)

    if (options.both) {
      this._hasMoved = true
      this.brush.update(newPointerPoint)
      return true
    }

    if (this._isEnabled) {
      this.distance = this.pointer.getDistanceTo(this.brush)
      this.angle = this.pointer.getAngleTo(this.brush)

      const isOutside = Math.round((this.distance - this.radius) * 10) / 10 > 0
      const friction =
        options.friction && options.friction < 1 && options.friction > 0
          ? options.friction
          : undefined

      if (isOutside) {
        this.brush.moveByAngle(
          this.angle,
          this.distance - this.radius,
          friction
        )
        this._hasMoved = true
      }
    } else {
      this.distance = 0
      this.angle = 0
      this.brush.update(newPointerPoint)
      this._hasMoved = true
    }

    return true
  }
}

export default Brush
