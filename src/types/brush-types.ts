export interface Point {
  x: number
  y: number
}

export interface BrushOptions {
  radius?: number
  enabled?: boolean
  initialPoint?: Point
  eraser?: boolean
}

export interface BrushUpdateOptions {
  both?: boolean
  friction?: number
}