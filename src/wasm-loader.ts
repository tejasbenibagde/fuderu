// src/wasm-loader.ts

import initWasmModule from '../core/pkg/core.js';

let wasmReady = false;
let brushRenderer: any = null;

export async function initWasm(): Promise<void> {
  if (!wasmReady) {
    const wasmModule = await initWasmModule();
    // Use the factory function instead of 'new BrushRenderer()'
    brushRenderer = wasmModule.brushrenderer_new();
    wasmReady = true;
    console.log('WASM module loaded');
  }
}

export function getBrushRenderer(): any {
  if (!brushRenderer) {
    throw new Error('WASM not initialized. Call initWasm() first.');
  }
  return brushRenderer;
}