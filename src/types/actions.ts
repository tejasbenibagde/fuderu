import type { BrushConfig } from "./config";
import type { StrokePoint } from "./events";
import type { BlendMode, LayerId } from "./layers";
import type {
  DrawRectangleOptions,
  DrawEllipseOptions,
  DrawLineOptions,
  TextStyleOptions,
} from "./commands";

/**
 * Strongly-typed identifier for recorded canvas actions.
 */
export type ActionId = string;

export interface BaseAction {
  id?: ActionId;
  timestamp?: number;
}

export interface StrokeAction extends BaseAction {
  type: "stroke";
  layerId: LayerId;
  brushConfig: Partial<BrushConfig>;
  points: StrokePoint[];
}

export interface FloodFillAction extends BaseAction {
  type: "floodFill";
  layerId: LayerId;
  x: number;
  y: number;
  color: string;
  tolerance?: number;
}

export interface DrawRectangleAction extends BaseAction {
  type: "drawRectangle";
  layerId: LayerId;
  options: DrawRectangleOptions;
}

export interface DrawEllipseAction extends BaseAction {
  type: "drawEllipse";
  layerId: LayerId;
  options: DrawEllipseOptions;
}

export interface DrawLineAction extends BaseAction {
  type: "drawLine";
  layerId: LayerId;
  options: DrawLineOptions;
}

export interface DrawTextAction extends BaseAction {
  type: "drawText";
  layerId: LayerId;
  text: string;
  x: number;
  y: number;
  options?: TextStyleOptions;
}

export interface ClearLayerAction extends BaseAction {
  type: "clearLayer";
  layerId: LayerId;
}

export interface FillLayerAction extends BaseAction {
  type: "fillLayer";
  layerId: LayerId;
  color: string;
}

export interface CreateLayerAction extends BaseAction {
  type: "createLayer";
  layerId?: LayerId;
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
  layerId: LayerId;
}

export interface MoveLayerAction extends BaseAction {
  type: "moveLayer";
  layerId: LayerId;
  targetIndex: number;
}

export interface SetLayerPropertiesAction extends BaseAction {
  type: "setLayerProperties";
  layerId: LayerId;
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
  layerId: LayerId;
}

export interface DuplicateLayerAction extends BaseAction {
  type: "duplicateLayer";
  layerId: LayerId;
  newLayerId?: LayerId;
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
