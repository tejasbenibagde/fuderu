import type { BlendMode } from "./layers";

export type BitmapFormat = "png" | "jpeg" | "webp";

export interface SerializedLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  dataUrl: string;
}

export interface FuderuDocument {
  version: 1;
  width: number;
  height: number;
  layers: SerializedLayer[];
  activeLayerId?: string;
}

export interface ExportDocumentOptions {
  bitmap?: BitmapFormat;
  quality?: number;
}

export interface ExportPNGOptions {
  includeBackground?: boolean;
  quality?: number;
}
