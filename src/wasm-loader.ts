import init, { BrushEngine as WasmBrushEngine } from '../pkg/core.js';

let initialized = false;

export async function initWasm(): Promise<void> {
  if (!initialized) {
    await init();
    initialized = true;
    console.log('WASM initialized');
  }
}

export function isWasmInitialized(): boolean {
  return initialized;
}

// 🔥 Strong type (matches Rust)
export interface WasmBrushRenderer {
  process(x: number, y: number, pressure: number, speed: number): number[];
  reset(): void;
  set_size(size: number): void;
  set_opacity(opacity: number): void;
  set_smoothing(value: number): void;
}

// 🔥 Factory
export function createBrushEngine(
  brushType: string = "dip-pen-soft"
): WasmBrushRenderer {
  if (!initialized) {
    throw new Error('WASM not initialized. Call initWasm() first.');
  }

  return new WasmBrushEngine(brushType) as unknown as WasmBrushRenderer;
}