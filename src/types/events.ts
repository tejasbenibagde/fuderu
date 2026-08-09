import type { Layer } from "../Layer";
import type { CanvasAction, StrokeAction } from "./actions";

export interface StrokeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

export interface StrokeStartEvent {
  layerId: string;
  point: StrokePoint;
}

export interface StrokeEndEvent {
  layerId: string;
  bounds: StrokeBounds;
  points: StrokePoint[];
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  index: number;
  length: number;
}

export interface CanvasSnapshot {
  documentWidth: number;
  documentHeight: number;
  layers: readonly Layer[];
  activeLayerId: string;
  history: HistoryState;
}

export interface CanvasEventMap {
  change: (snapshot: CanvasSnapshot) => void;
  "stroke:start": (event: StrokeStartEvent) => void;
  "stroke:end": (event: StrokeEndEvent) => void;
  "stroke:record": (action: StrokeAction) => void;
  "action:record": (action: CanvasAction) => void;
  "history:change": (history: HistoryState) => void;
  "layer:change": (layers: readonly Layer[], activeLayerId: string) => void;
}
