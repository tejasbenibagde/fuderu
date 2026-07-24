import { HistoryEntry } from "./types/history";
import type { Layer } from "./Layer";
import type { Brush } from "./Brush";
import type { BlendMode } from "./types/layers";

export interface HistoryContext {
  getLayer(layerId: string): Layer | undefined;
  getLayers(): readonly Layer[];
  getActiveLayer(): Layer;
  setActiveLayer(layerId: string): void;
  renderLayers(): void;
  getBrush(): Brush;
  deleteLayerOnly(layerId: string): void;
  insertLayerOnly(layer: Layer, index: number): void;
  moveLayerOnly(layerId: string, index: number): void;
}

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxStackSize: number = 30;

  constructor(maxStackSize: number = 30) {
    this.maxStackSize = maxStackSize;
  }

  public push(entry: HistoryEntry): void {
    this.undoStack.push(entry);
    this.redoStack = [];

    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  public undo(): void {
    const entry = this.undoStack.pop();
    if (entry) {
      entry.undo();
      this.redoStack.push(entry);
    }
  }

  public redo(): void {
    const entry = this.redoStack.pop();
    if (entry) {
      entry.redo();
      this.undoStack.push(entry);
    }
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

export class CanvasStateHistoryEntry implements HistoryEntry {
  constructor(
    private layerId: string,
    private beforeData: ImageData,
    private afterData: ImageData,
    private context: HistoryContext,
    private x: number = 0,
    private y: number = 0,
  ) {}

  undo(): void {
    const layer = this.context.getLayer(this.layerId);
    if (!layer) return;
    const ctx = layer.canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(this.beforeData, this.x, this.y);

    const active = this.context.getActiveLayer();
    if (active && active.id === this.layerId) {
      this.context.getBrush().loadContext(layer.canvas);
    }
    this.context.renderLayers();
  }

  redo(): void {
    const layer = this.context.getLayer(this.layerId);
    if (!layer) return;
    const ctx = layer.canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(this.afterData, this.x, this.y);

    const active = this.context.getActiveLayer();
    if (active && active.id === this.layerId) {
      this.context.getBrush().loadContext(layer.canvas);
    }
    this.context.renderLayers();
  }
}

export class LayerCreatedHistoryEntry implements HistoryEntry {
  constructor(
    private layer: Layer,
    private context: HistoryContext,
    private index?: number,
  ) {}

  undo(): void {
    this.context.deleteLayerOnly(this.layer.id);
    this.context.renderLayers();
  }

  redo(): void {
    const targetIdx =
      this.index !== undefined ? this.index : this.context.getLayers().length;
    this.context.insertLayerOnly(this.layer, targetIdx);
    this.context.setActiveLayer(this.layer.id);
    this.context.renderLayers();
  }
}

export class LayerDeletedHistoryEntry implements HistoryEntry {
  constructor(
    private layer: Layer,
    private index: number,
    private wasActive: boolean,
    private context: HistoryContext,
  ) {}

  undo(): void {
    this.context.insertLayerOnly(this.layer, this.index);
    if (this.wasActive) {
      this.context.setActiveLayer(this.layer.id);
    }
    this.context.renderLayers();
  }

  redo(): void {
    this.context.deleteLayerOnly(this.layer.id);
    this.context.renderLayers();
  }
}

export class LayerPropertyHistoryEntry implements HistoryEntry {
  constructor(
    private layerId: string,
    private propertyName: "name" | "visible" | "opacity" | "blendMode",
    private beforeValue: string | number | boolean,
    private afterValue: string | number | boolean,
    private context: HistoryContext,
  ) {}

  undo(): void {
    const layer = this.context.getLayer(this.layerId);
    if (!layer) return;
    if (this.propertyName === "opacity") {
      layer.setOpacity(this.beforeValue as number);
    } else if (this.propertyName === "name") {
      layer.name = this.beforeValue as string;
    } else if (this.propertyName === "visible") {
      layer.visible = this.beforeValue as boolean;
    } else if (this.propertyName === "blendMode") {
      layer.blendMode = this.beforeValue as BlendMode;
    }
    this.context.renderLayers();
  }

  redo(): void {
    const layer = this.context.getLayer(this.layerId);
    if (!layer) return;
    if (this.propertyName === "opacity") {
      layer.setOpacity(this.afterValue as number);
    } else if (this.propertyName === "name") {
      layer.name = this.afterValue as string;
    } else if (this.propertyName === "visible") {
      layer.visible = this.afterValue as boolean;
    } else if (this.propertyName === "blendMode") {
      layer.blendMode = this.afterValue as BlendMode;
    }
    this.context.renderLayers();
  }
}

export class MoveLayerHistoryEntry implements HistoryEntry {
  constructor(
    private layerId: string,
    private beforeIndex: number,
    private afterIndex: number,
    private context: HistoryContext,
  ) {}

  undo(): void {
    this.context.moveLayerOnly(this.layerId, this.beforeIndex);
    this.context.renderLayers();
  }

  redo(): void {
    this.context.moveLayerOnly(this.layerId, this.afterIndex);
    this.context.renderLayers();
  }
}
