export interface HistoryEntrySummary {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  layerId?: string;
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
  layerId?: string;
  beforeData: ImageData;
  afterData: ImageData;
  x?: number;
  y?: number;
  description?: string;
}
