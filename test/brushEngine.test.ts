import { describe, it, expect, vi } from 'vitest';
import { BrushEngine } from '../src/core/BrushEngine';
import { createBrushEngine } from '../src/wasm-loader';

describe('BrushEngine', () => {
  it('preserves current size, opacity, and smoothing when switching brushes', () => {
    const mockBrushEngine = (global as any).createMockBrushEngine();

    mockBrushEngine.set_size.mockClear();
    mockBrushEngine.set_opacity.mockClear();
    mockBrushEngine.set_smoothing.mockClear();
    vi.mocked(createBrushEngine).mockClear();

    const engine = new BrushEngine();
    engine.setSize(30);
    engine.setOpacity(0.4);
    engine.setSmoothing(0.75);

    mockBrushEngine.set_size.mockClear();
    mockBrushEngine.set_opacity.mockClear();
    mockBrushEngine.set_smoothing.mockClear();

    engine.setBrush('airbrush-normal');

    expect(createBrushEngine).toHaveBeenCalledWith('airbrush-normal');
    expect(mockBrushEngine.set_size).toHaveBeenCalledWith(30);
    expect(mockBrushEngine.set_opacity).toHaveBeenCalledWith(0.4);
    expect(mockBrushEngine.set_smoothing).toHaveBeenCalledWith(0.75);
  });
});
