// src/presets/index.ts

export type BrushPreset = 
  | 'pencil' 
  | 'marker' 
  | 'watercolor' 
  | 'airbrush' 
  | 'charcoal'
  | 'calligraphy'

interface PresetConfig {
  radius: number      
  size: number        
  friction: number   
  spacingMin: number  
  spacingMax: number 
  densityCompensation: boolean
}

const PRESETS: Record<BrushPreset, PresetConfig> = {
  pencil: {
    radius: 20,
    size: 4,
    friction: 0.3,
    spacingMin: 0.5,
    spacingMax: 8,
    densityCompensation: true
  },
  marker: {
    radius: 30,
    size: 12,
    friction: 0.2,
    spacingMin: 0.5,
    spacingMax: 10,
    densityCompensation: true
  },
  watercolor: {
    radius: 40,
    size: 20,
    friction: 0.6,
    spacingMin: 1.0,
    spacingMax: 14,
    densityCompensation: true
  },
  airbrush: {
    radius: 25,
    size: 30,
    friction: 0.7,
    spacingMin: 0.3,
    spacingMax: 6,
    densityCompensation: false
  },
  charcoal: {
    radius: 35,
    size: 15,
    friction: 0.5,
    spacingMin: 0.8,
    spacingMax: 12,
    densityCompensation: true
  },
  calligraphy: {
    radius: 15,
    size: 8,
    friction: 0.4,
    spacingMin: 0.4,
    spacingMax: 9,
    densityCompensation: true
  }
}

export default PRESETS;