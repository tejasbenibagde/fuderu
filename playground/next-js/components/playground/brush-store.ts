import { create } from "zustand";

type BrushStore = {
  size: number;
  radius: number;
  friction: number;
  opacity: number;
  color: string;
  eraser: boolean;

  clearTrigger: number;

  setSize: (size: number) => void;
  setRadius: (radius: number) => void;
  setFriction: (friction: number) => void;
  setOpacity: (opacity: number) => void;
  setColor: (color: string) => void;
  setEraser: (eraser: boolean) => void;

  clearCanvas: () => void;
};

export const useBrushStore = create<BrushStore>(
  (set) => ({
    size: 12,
    radius: 30,
    friction: 0.12,
    opacity: 1,
    color: "#000000",
    eraser: false,

    clearTrigger: 0,

    setSize: (size) =>
      set({
        size,
      }),

    setRadius: (radius) =>
      set({
        radius,
      }),

    setFriction: (friction) =>
      set({
        friction,
      }),

    setOpacity: (opacity) =>
      set({
        opacity,
      }),

    setColor: (color) =>
      set({
        color,
      }),

    setEraser: (eraser) =>
      set({
        eraser,
      }),

    clearCanvas: () =>
      set((state) => ({
        clearTrigger:
          state.clearTrigger + 1,
      })),
  })
);