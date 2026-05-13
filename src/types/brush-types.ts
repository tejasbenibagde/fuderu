export interface Point {
  x: number
  y: number
}

export interface BrushOptions {
  radius?: number
  enabled?: boolean
  initialPoint?: Point
}

export interface BrushUpdateOptions {
  both?: boolean
  friction?: number
}