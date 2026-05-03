// test/setup.ts
import { vi } from 'vitest';

// Mock HTMLCanvasElement and CanvasRenderingContext2D
const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600
  })),
  width: 800,
  height: 600
};

const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  globalCompositeOperation: '',
  globalAlpha: 1,
  strokeStyle: '#000000',
  lineWidth: 1,
  lineCap: 'round',
  lineJoin: 'round'
};

// Mock WASM module
const mockBrushEngine = {
  process: vi.fn(() => [10, 20, 5, 0.8]),
  reset: vi.fn(),
  set_size: vi.fn(),
  set_opacity: vi.fn(),
  set_smoothing: vi.fn()
};

const mockWasmModule = {
  BrushEngine: vi.fn(() => mockBrushEngine)
};

// Mock the WASM loader
vi.mock('../src/wasm-loader', () => ({
  initWasm: vi.fn(() => Promise.resolve()),
  createBrushEngine: vi.fn(() => mockBrushEngine),
  isWasmInitialized: vi.fn(() => true)
}));

// Mock document methods
Object.defineProperty(document, 'getElementById', {
  writable: true,
  value: vi.fn((id) => {
    if (id === 'test-canvas') return mockCanvas;
    return null;
  })
});

Object.defineProperty(document, 'querySelector', {
  writable: true,
  value: vi.fn((selector) => {
    if (selector === '#test-canvas') return mockCanvas;
    return null;
  })
});

Object.defineProperty(document, 'addEventListener', {
  writable: true,
  value: vi.fn()
});

// Global test utilities
(global as any).createMockCanvas = () => mockCanvas;
(global as any).createMockContext = () => mockContext;
(global as any).createMockBrushEngine = () => mockBrushEngine;