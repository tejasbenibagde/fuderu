// src/Point.ts

import type { Point } from './types'
import { ease } from './util'

/**
 * BrushPoint - A 2D point with utility methods for geometry calculations.
 * 
 * This class represents a point in 2D space (x, y) and provides methods for:
 * - Distance calculation
 * - Angle calculation
 * - Movement by angle and distance
 * - Equality checking
 * 
 * It's used both for the "pointer" (cursor position) and "brush" (drawing position)
 * in the lazy brush algorithm.
 */
export class BrushPoint implements Point {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  /**
   * Update the x and y values to a new position.
   * @param point - New coordinates
   * @returns This BrushPoint instance (for chaining)
   */
  update(point: Point): BrushPoint {
    this.x = point.x
    this.y = point.y
    return this
  }

  /**
   * Move the point to another position using an angle and distance.
   * 
   * This is the core movement function for the lazy brush.
   * Instead of moving directly to a target, it moves along a specific angle,
   * which creates the "smooth following" effect.
   * 
   * @param angle - Direction to move in radians
   * @param distance - How far to move
   * @param friction - Smoothing factor (0-1). Lower values = shorter movement,
   *                   creating a "sluggish" or "elastic" feel.
   * @returns This BrushPoint instance (for chaining)
   * 
   * Math explanation:
   * - sin(angleRotated) gives the X direction (horizontal movement)
   * - cos(angleRotated) gives the Y direction (vertical movement)
   * - The angle is rotated by 90 degrees (PI/2) because canvas coordinates
   *   have Y increasing downward, while standard math has Y increasing upward.
   * - When friction is applied, we use an easing function to non-linearly
   *   reduce the distance, creating a smoother stop.
   */
  moveByAngle(
    // The angle in radians (0 = right, PI/2 = down, PI = left, etc.)
    angle: number,
    // How much the point should be moved (in pixels)
    distance: number,
    // How much of the required distance the coordinates are moved. A value of
    // 1 means the full distance is moved. A lower value reduces the distance
    // and makes the brush more sluggish.
    friction?: number
  ): BrushPoint {
    // Rotate the angle by 90 degrees to convert from math coordinates
    // (0 = right, increasing counter-clockwise) to canvas coordinates
    // (0 = right, increasing clockwise with Y down)
    const angleRotated = angle + Math.PI / 2

    if (friction) {
      // With friction: move only a fraction of the distance
      // The ease() function applies non-linear smoothing
      // Lower friction = less movement = more "lazy" effect
      this.x = this.x + Math.sin(angleRotated) * distance * ease(1 - friction)
      this.y = this.y - Math.cos(angleRotated) * distance * ease(1 - friction)
    } else {
      // Without friction: move the full distance instantly
      this.x = this.x + Math.sin(angleRotated) * distance
      this.y = this.y - Math.cos(angleRotated) * distance
    }

    return this
  }

  /**
   * Check if this point is the same as another point.
   * @param point - Point to compare against
   * @returns True if x AND y are exactly equal
   */
  equalsTo(point: Point): boolean {
    return this.x === point.x && this.y === point.y
  }

  /**
   * Get the difference for x and y axis to another point.
   * Returns a new BrushPoint where:
   * - diff.x = this.x - point.x
   * - diff.y = this.y - point.y
   * 
   * @param point - Point to subtract
   * @returns A new BrushPoint representing the difference
   */
  getDifferenceTo(point: Point): BrushPoint {
    return new BrushPoint(this.x - point.x, this.y - point.y)
  }

  /**
   * Calculate Euclidean distance to another point.
   * Formula: sqrt((x2 - x1)² + (y2 - y1)²)
   * 
   * @param point - Point to calculate distance to
   * @returns Distance in pixels
   */
  getDistanceTo(point: Point): number {
    const diff = this.getDifferenceTo(point)
    return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2))
  }

  /**
   * Calculate the angle (direction) to another point.
   * Uses arctangent to find the angle between the two points.
   * 
   * @param point - Point to calculate angle to
   * @returns Angle in radians, where:
   *          - 0 = to the right
   *          - PI/2 = downward
   *          - PI = to the left
   *          - -PI/2 = upward
   */
  getAngleTo(point: Point): number {
    const diff = this.getDifferenceTo(point)
    // atan2(y, x) gives the angle from the positive X axis
    return Math.atan2(diff.y, diff.x)
  }

  /**
   * Return a simple object with x and y properties.
   * Useful for APIs that expect plain objects instead of class instances.
   * @returns Plain object with x and y properties
   */
  toObject(): Point {
    return {
      x: this.x,
      y: this.y
    }
  }
}