import { create } from "zustand";

export type RotationMode = "fixed" | "flow" | "random";
export type PressureTrigger = "none" | "pressure";

type BrushStore = {
  size: number;
  opacity: number;
  color: string;
  spacing: number;
  flow: number;
  roundness: number;
  angle: number;
  eraser: boolean;
  image: string | null;
  smooth: boolean;
  spacingEnabled: boolean;
  pressureSimulation: boolean;

  rotationMode: RotationMode;
  rotationOffset: number;
  rotationJitter: number;
  rotationSmoothing: number;

  dynamicShapeEnabled: boolean;
  sizeJitter: number;
  sizeJitterTrigger: PressureTrigger;
  minDiameter: number;
  angleJitter: number;
  angleJitterTrigger: PressureTrigger;
  roundJitter: number;
  roundJitterTrigger: PressureTrigger;
  minRoundness: number;

  dynamicTransparencyEnabled: boolean;
  opacityJitter: number;
  opacityJitterTrigger: PressureTrigger;
  minOpacityJitter: number;
  flowJitter: number;
  flowJitterTrigger: PressureTrigger;
  minFlowJitter: number;

  spreadEnabled: boolean;
  spreadRange: number;
  spreadTrigger: PressureTrigger;
  spreadCount: number;
  spreadCountJitter: number;
  spreadCountJitterTrigger: PressureTrigger;

  patternEnabled: boolean;
  patternImage: string | null;
  patternScale: number;
  patternBrightness: number;
  patternContrast: number;
  patternTint: string;

  clearTrigger: number;
  undoTrigger: number;
  redoTrigger: number;

  setSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setColor: (color: string) => void;
  setSpacing: (spacing: number) => void;
  setFlow: (flow: number) => void;
  setRoundness: (roundness: number) => void;
  setAngle: (angle: number) => void;
  setEraser: (eraser: boolean) => void;
  setImage: (image: string | null) => void;
  setSmooth: (smooth: boolean) => void;
  setSpacingEnabled: (spacingEnabled: boolean) => void;
  setPressureSimulation: (pressureSimulation: boolean) => void;

  setRotationMode: (rotationMode: RotationMode) => void;
  setRotationOffset: (rotationOffset: number) => void;
  setRotationJitter: (rotationJitter: number) => void;
  setRotationSmoothing: (rotationSmoothing: number) => void;

  setDynamicShapeEnabled: (dynamicShapeEnabled: boolean) => void;
  setSizeJitter: (sizeJitter: number) => void;
  setSizeJitterTrigger: (sizeJitterTrigger: PressureTrigger) => void;
  setMinDiameter: (minDiameter: number) => void;
  setAngleJitter: (angleJitter: number) => void;
  setAngleJitterTrigger: (angleJitterTrigger: PressureTrigger) => void;
  setRoundJitter: (roundJitter: number) => void;
  setRoundJitterTrigger: (roundJitterTrigger: PressureTrigger) => void;
  setMinRoundness: (minRoundness: number) => void;

  setDynamicTransparencyEnabled: (dynamicTransparencyEnabled: boolean) => void;
  setOpacityJitter: (opacityJitter: number) => void;
  setOpacityJitterTrigger: (opacityJitterTrigger: PressureTrigger) => void;
  setMinOpacityJitter: (minOpacityJitter: number) => void;
  setFlowJitter: (flowJitter: number) => void;
  setFlowJitterTrigger: (flowJitterTrigger: PressureTrigger) => void;
  setMinFlowJitter: (minFlowJitter: number) => void;

  setSpreadEnabled: (spreadEnabled: boolean) => void;
  setSpreadRange: (spreadRange: number) => void;
  setSpreadTrigger: (spreadTrigger: PressureTrigger) => void;
  setSpreadCount: (spreadCount: number) => void;
  setSpreadCountJitter: (spreadCountJitter: number) => void;
  setSpreadCountJitterTrigger: (
    spreadCountJitterTrigger: PressureTrigger,
  ) => void;

  setPatternEnabled: (patternEnabled: boolean) => void;
  setPatternImage: (patternImage: string | null) => void;
  setPatternScale: (patternScale: number) => void;
  setPatternBrightness: (patternBrightness: number) => void;
  setPatternContrast: (patternContrast: number) => void;
  setPatternTint: (patternTint: string) => void;

  clearCanvas: () => void;
  undoCanvas: () => void;
  redoCanvas: () => void;
};

export const useBrushStore = create<BrushStore>((set) => ({
  size: 20,
  opacity: 1,
  color: "#000000",
  spacing: 0.01,
  flow: 1,
  roundness: 1,
  angle: 0,
  smooth: true,
  spacingEnabled: true,
  pressureSimulation: true,
  image: null,

  rotationMode: "flow",
  rotationOffset: 0,
  rotationJitter: 0,
  rotationSmoothing: 0.15,
  eraser: false,

  dynamicShapeEnabled: false,
  sizeJitter: 0.25,
  sizeJitterTrigger: "none",
  minDiameter: 0.15,
  angleJitter: 0,
  angleJitterTrigger: "none",
  roundJitter: 0,
  roundJitterTrigger: "none",
  minRoundness: 0.2,

  dynamicTransparencyEnabled: false,
  opacityJitter: 0,
  opacityJitterTrigger: "none",
  minOpacityJitter: 0.2,
  flowJitter: 0.25,
  flowJitterTrigger: "pressure",
  minFlowJitter: 0.2,

  spreadEnabled: false,
  spreadRange: 0.25,
  spreadTrigger: "none",
  spreadCount: 3,
  spreadCountJitter: 0,
  spreadCountJitterTrigger: "none",

  patternEnabled: false,
  patternImage: null,
  patternScale: 1,
  patternBrightness: 100,
  patternContrast: 100,
  patternTint: "#000000",

  clearTrigger: 0,
  undoTrigger: 0,
  redoTrigger: 0,

  setSize: (size) => set({ size }),
  setOpacity: (opacity) => set({ opacity }),
  setColor: (color) => set({ color }),
  setSpacing: (spacing) => set({ spacing }),
  setFlow: (flow) => set({ flow }),
  setRoundness: (roundness) => set({ roundness }),
  setAngle: (angle) => set({ angle }),  setEraser: (eraser: boolean) => set({ eraser }),  setSmooth: (smooth) => set({ smooth }),
  setSpacingEnabled: (spacingEnabled) => set({ spacingEnabled }),
  setPressureSimulation: (pressureSimulation) => set({ pressureSimulation }),
  setImage: (image) => set({ image }),

  setRotationMode: (rotationMode) => set({ rotationMode }),
  setRotationOffset: (rotationOffset) => set({ rotationOffset }),
  setRotationJitter: (rotationJitter) => set({ rotationJitter }),
  setRotationSmoothing: (rotationSmoothing) => set({ rotationSmoothing }),

  setDynamicShapeEnabled: (dynamicShapeEnabled) => set({ dynamicShapeEnabled }),
  setSizeJitter: (sizeJitter) => set({ sizeJitter }),
  setSizeJitterTrigger: (sizeJitterTrigger) => set({ sizeJitterTrigger }),
  setMinDiameter: (minDiameter) => set({ minDiameter }),
  setAngleJitter: (angleJitter) => set({ angleJitter }),
  setAngleJitterTrigger: (angleJitterTrigger) => set({ angleJitterTrigger }),
  setRoundJitter: (roundJitter) => set({ roundJitter }),
  setRoundJitterTrigger: (roundJitterTrigger) => set({ roundJitterTrigger }),
  setMinRoundness: (minRoundness) => set({ minRoundness }),

  setDynamicTransparencyEnabled: (dynamicTransparencyEnabled) =>
    set({ dynamicTransparencyEnabled }),
  setOpacityJitter: (opacityJitter) => set({ opacityJitter }),
  setOpacityJitterTrigger: (opacityJitterTrigger) =>
    set({ opacityJitterTrigger }),
  setMinOpacityJitter: (minOpacityJitter) => set({ minOpacityJitter }),
  setFlowJitter: (flowJitter) => set({ flowJitter }),
  setFlowJitterTrigger: (flowJitterTrigger) => set({ flowJitterTrigger }),
  setMinFlowJitter: (minFlowJitter) => set({ minFlowJitter }),

  setSpreadEnabled: (spreadEnabled) => set({ spreadEnabled }),
  setSpreadRange: (spreadRange) => set({ spreadRange }),
  setSpreadTrigger: (spreadTrigger) => set({ spreadTrigger }),
  setSpreadCount: (spreadCount) => set({ spreadCount }),
  setSpreadCountJitter: (spreadCountJitter) => set({ spreadCountJitter }),
  setSpreadCountJitterTrigger: (spreadCountJitterTrigger) =>
    set({ spreadCountJitterTrigger }),

  setPatternEnabled: (patternEnabled) => set({ patternEnabled }),
  setPatternImage: (patternImage) => set({ patternImage }),
  setPatternScale: (patternScale) => set({ patternScale }),
  setPatternBrightness: (patternBrightness) => set({ patternBrightness }),
  setPatternContrast: (patternContrast) => set({ patternContrast }),
  setPatternTint: (patternTint) => set({ patternTint }),

  clearCanvas: () =>
    set((state) => ({
      clearTrigger: state.clearTrigger + 1,
    })),

  undoCanvas: () =>
    set((state) => ({
      undoTrigger: state.undoTrigger + 1,
    })),

  redoCanvas: () =>
    set((state) => ({
      redoTrigger: state.redoTrigger + 1,
    })),
}));
