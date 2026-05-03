// test/fuderu.test.ts
import { describe, it, expect } from 'vitest';

describe('Fuderu Basic Test', () => {
  it('should be able to import Fuderu', async () => {
    // Just test that we can import the module without errors
    const { Fuderu } = await import('../src/index');
    expect(Fuderu).toBeDefined();
    expect(typeof Fuderu).toBe('function');
  });

  it('should have expected methods on prototype', async () => {
    const { Fuderu } = await import('../src/index');

    // Check that the class has the expected methods
    const prototype = Fuderu.prototype as any;
    const methods = ['setColor', 'setSize', 'setOpacity', 'clear', 'hello'];

    methods.forEach(method => {
      expect(prototype[method]).toBeDefined();
      expect(typeof prototype[method]).toBe('function');
    });
  });
});