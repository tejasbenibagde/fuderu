// src/types/clipboard.ts

import type { LayerId } from "./layers";

export interface ClipboardData {
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
  readonly imageData: ImageData;
  readonly maskData?: ImageData | null;
  readonly sourceLayerId?: LayerId;
  readonly timestamp: number;
}

export interface ClipboardSnapshot {
  readonly hasData: boolean;
  readonly width?: number;
  readonly height?: number;
  readonly timestamp?: number;
}

export interface CopyOptions {
  layerId?: LayerId;
}

export interface CutOptions {
  layerId?: LayerId;
}

export interface PasteOptions {
  /** Target layer ID. Defaults to the active layer unless createLayer is true */
  targetLayerId?: LayerId;
  /** Destination X coordinate. Defaults to source X coordinate or centered */
  x?: number;
  /** Destination Y coordinate. Defaults to source Y coordinate or centered */
  y?: number;
  /** If true, creates a new layer for the pasted raster content */
  createLayer?: boolean;
  /** Name of the new layer if createLayer is true */
  newLayerName?: string;
  /** If true, sets the selection marquee to match the pasted bounds */
  asSelection?: boolean;
  /** If true, starts an interactive TransformSession on the pasted content */
  asTransform?: boolean;
  /** Explicit clipboard data payload, bypassing internal clipboard store */
  clipboardData?: ClipboardData;
}

export interface PasteResult {
  layerId: LayerId;
  x: number;
  y: number;
  width: number;
  height: number;
}
