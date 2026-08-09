import type { BrushConfig } from "./config";
import type { StrokePoint } from "./events";
import type { BlendMode } from "./layers";
import type {
  DrawRectangleOptions,
  DrawEllipseOptions,
  DrawLineOptions,
  TextStyleOptions,
} from "./commands";

export interface BaseAction {
  id?: string;
  timestamp?: number;
}

export interface StrokeAction extends BaseAction {
  type: "stroke";
  layerId: string;
  brushConfig: Partial<BrushConfig>;
  points: StrokePoint[];
}

export interface FloodFillAction extends BaseAction {
  type: "floodFill";
  layerId: string;
  x: number;
  y: number;
  color: string;
  tolerance?: number;
}

export interface DrawRectangleAction extends BaseAction {
  type: "drawRectangle";
  layerId: string;
  options: DrawRectangleOptions;
}

export interface DrawEllipseAction extends BaseAction {
  type: "drawEllipse";
  layerId: string;
  options: DrawEllipseOptions;
}

export interface DrawLineAction extends BaseAction {
  type: "drawLine";
  layerId: string;
  options: DrawLineOptions;
}

export interface DrawTextAction extends BaseAction {
  type: "drawText";
  layerId: string;
  text: string;
  x: number;
  y: number;
  options?: TextStyleOptions;
}

export interface ClearLayerAction extends BaseAction {
  type: "clearLayer";
  layerId: string;
}

export interface FillLayerAction extends BaseAction {
  type: "fillLayer";
  layerId: string;
  color: string;
}

export interface CreateLayerAction extends BaseAction {
  type: "createLayer";
  layerId?: string;
  name?: string;
  options?: {
    visible?: boolean;
    opacity?: number;
    blendMode?: BlendMode;
    alphaLock?: boolean;
    locked?: boolean;
  };
}

export interface DeleteLayerAction extends BaseAction {
  type: "deleteLayer";
  layerId: string;
}

export interface MoveLayerAction extends BaseAction {
  type: "moveLayer";
  layerId: string;
  targetIndex: number;
}

export interface SetLayerPropertiesAction extends BaseAction {
  type: "setLayerProperties";
  layerId: string;
  properties: {
    name?: string;
    visible?: boolean;
    opacity?: number;
    blendMode?: BlendMode;
    alphaLock?: boolean;
    locked?: boolean;
  };
}

export interface MergeLayerDownAction extends BaseAction {
  type: "mergeLayerDown";
  layerId: string;
}

export interface DuplicateLayerAction extends BaseAction {
  type: "duplicateLayer";
  layerId: string;
  newLayerId?: string;
}

export type CanvasAction =
  | StrokeAction
  | FloodFillAction
  | DrawRectangleAction
  | DrawEllipseAction
  | DrawLineAction
  | DrawTextAction
  | ClearLayerAction
  | FillLayerAction
  | CreateLayerAction
  | DeleteLayerAction
  | MoveLayerAction
  | SetLayerPropertiesAction
  | MergeLayerDownAction
  | DuplicateLayerAction;

export interface ReplayOptions {
  /** Speed multiplier for animated replay (e.g., 2 = twice as fast, 0 = instant) */
  speed?: number;
  /** Fixed delay between actions in milliseconds if speed is not set */
  delayMs?: number;
  /** Callback fired before executing each action */
  onAction?: (action: CanvasAction, index: number, total: number) => void;
  /** Callback fired as progress advances (0 to 1) */
  onProgress?: (progress: number, current: number, total: number) => void;
  /** Whether to animate strokes point-by-point during replay */
  animateStrokes?: boolean;
}
