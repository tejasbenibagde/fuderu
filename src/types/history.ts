import type { LayerId } from "./layers";

export interface HistoryEntrySummary {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  layerId?: LayerId;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface HistoryEntry {
  id?: string;
  type?: string;
  description?: string;
  timestamp?: number;
  undo(): void;
  redo(): void;
  getSummary?(): HistoryEntrySummary;
}

export interface PushPatchOptions {
  layerId?: LayerId;
  beforeData: ImageData;
  afterData: ImageData;
  x?: number;
  y?: number;
  description?: string;
}
