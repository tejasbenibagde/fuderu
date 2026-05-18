export interface Point {
  x: number
  y: number
}

export interface BrushOptions {
  radius?: number
  enabled?: boolean
  initialPoint?: Point
  eraser?: boolean
  size?: number
}

export interface BrushUpdateOptions {
  both?: boolean
  friction?: number
}

export interface BrushEngineConfig {
  spacingMin?: number
  spacingMax?: number

  densityCompensation?: boolean

  interpolation?: 'linear' | 'smooth'

  spacingMultiplier?: number

  opacityCurve?: number

  densityCurve?: number
}