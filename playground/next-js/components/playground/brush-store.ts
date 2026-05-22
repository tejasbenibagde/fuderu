import { create } from "zustand";

type BrushStore = {
  size: number;
  opacity: number;
  color: string;

  spacing: number;
  flow: number;
  roundness: number;
  image: string | null;
  smooth: boolean;

  clearTrigger: number;
  undoTrigger: number;
  redoTrigger: number;

  setSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setColor: (color: string) => void;

  setSpacing: (spacing: number) => void;
  setFlow: (flow: number) => void;
  setRoundness: (roundness: number) => void;
  setImage: (image: string | null) => void;
  setSmooth: (smooth: boolean) => void;

  clearCanvas: () => void;
  undoCanvas: () => void;
  redoCanvas: () => void;
};

export const useBrushStore = create<BrushStore>((set) => ({
  size: 20,
  opacity: 1,
  color: "#000000",

  spacing: 0.5,
  flow: 1,
  roundness: 1,

  smooth: true,
  image: null,

  clearTrigger: 0,
  undoTrigger: 0,
  redoTrigger: 0,

  setSize: (size) => set({ size }),

  setOpacity: (opacity) => set({ opacity }),

  setColor: (color) => set({ color }),

  setSpacing: (spacing) => set({ spacing }),

  setFlow: (flow) => set({ flow }),

  setRoundness: (roundness) => set({ roundness }),

  setSmooth: (smooth) => set({ smooth }),

  clearCanvas: () =>
    set((state) => ({
      clearTrigger: state.clearTrigger + 1,
    })),

  setImage: (image: string | null) =>
    set({
      image,
    }),

  undoCanvas: () =>
    set((state) => ({
      undoTrigger: state.undoTrigger + 1,
    })),

  redoCanvas: () =>
    set((state) => ({
      redoTrigger: state.redoTrigger + 1,
    })),
}));
