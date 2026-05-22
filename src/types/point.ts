import { BrushBasicConfig } from "./config";

export interface Vec2 {
  x: number;
  y: number;
}

export interface PurePoint extends Vec2 {
  pressure: number;
}

export interface Point extends PurePoint {
  config: BrushBasicConfig;
  rotation?: number;
  strokeEnd?: boolean;
  callback?: PointCallBack;
  edgeAlpha?: number;
}

export type PointCallBack = () => void;
