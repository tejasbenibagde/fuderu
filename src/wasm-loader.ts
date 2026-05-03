import init, { BrushEngine } from '../pkg/core.js';

let initialized = false;

export async function initWasm(): Promise<void> {
  if (!initialized) {
    await init();
    initialized = true;
    console.log('WASM initialized');
  }
}

export function createBrushEngine(brushType: string = "dip-pen-soft") {
  if (!initialized) {
    throw new Error('WASM not initialized. Call initWasm() first.');
  }

  return new BrushEngine(brushType);
}