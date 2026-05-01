// src/index.ts - Just the bare minimum to test the build

export class Fuderu {
  constructor(options: { canvas: HTMLCanvasElement | string }) {
    console.log('Fuderu initialized with:', options.canvas);
  }
  
  public hello(): string {
    return 'Fuderu is ready! 🖌️';
  }
}

export default Fuderu;