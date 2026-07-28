import type {
  HistoryEntry,
  HistoryEntrySummary,
  PushPatchOptions,
} from "./types/history";
import type { HistoryState } from "./types/events";
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
  private context?: HistoryContext;
  public onHistoryChange?: () => void;

  constructor(maxStackSize: number = 30, context?: HistoryContext) {
    this.maxStackSize = maxStackSize;
    this.context = context;
  }

  public setContext(context: HistoryContext): void {
    this.context = context;
  }

  public push(entry: HistoryEntry): void {
    this.undoStack.push(entry);
    this.redoStack = [];

    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
    this.onHistoryChange?.();
  }

  public undo(): void {
    const entry = this.undoStack.pop();
    if (entry) {
      entry.undo();
      this.redoStack.push(entry);
      this.onHistoryChange?.();
    }
  }

  public redo(): void {
    const entry = this.redoStack.pop();
    if (entry) {
      entry.redo();
      this.undoStack.push(entry);
      this.onHistoryChange?.();
    }
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.onHistoryChange?.();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getHistoryState(): HistoryState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      index: this.undoStack.length,
      length: this.undoStack.length + this.redoStack.length,
    };
  }

  public getEntries(): readonly HistoryEntrySummary[] {
    const allEntries = [...this.undoStack, ...this.redoStack.slice().reverse()];
    return allEntries.map((entry, index) => this.toSummary(entry, index));
  }

  public goTo(index: number): void {
    const totalLength = this.undoStack.length + this.redoStack.length;
    const targetIndex = Math.max(0, Math.min(index, totalLength));
    const currentIndex = this.undoStack.length;

    if (targetIndex === currentIndex) return;

    if (targetIndex < currentIndex) {
      const steps = currentIndex - targetIndex;
      for (let i = 0; i < steps; i++) {
        const entry = this.undoStack.pop();
        if (entry) {
          entry.undo();
          this.redoStack.push(entry);
        }
      }
    } else {
      const steps = targetIndex - currentIndex;
      for (let i = 0; i < steps; i++) {
        const entry = this.redoStack.pop();
        if (entry) {
          entry.redo();
          this.undoStack.push(entry);
        }
      }
    }
    this.onHistoryChange?.();
  }

  public pushPatch(options: PushPatchOptions): void;
  public pushPatch(
    beforeData: ImageData,
    afterData: ImageData,
    x?: number,
    y?: number,
    layerId?: string,
    description?: string,
  ): void;
  public pushPatch(
    optionsOrBefore: PushPatchOptions | ImageData,
    afterData?: ImageData,
    x: number = 0,
    y: number = 0,
    layerId?: string,
    description?: string,
  ): void {
    if (!this.context) {
      throw new Error("Cannot push patch without a registered HistoryContext");
    }

    let bData: ImageData;
    let aData: ImageData;
    let posX = x;
    let posY = y;
    let targetLayerId = layerId;
    let desc = description ?? "Raster patch";

    if (
      optionsOrBefore &&
      typeof optionsOrBefore === "object" &&
      "beforeData" in optionsOrBefore &&
      "afterData" in optionsOrBefore
    ) {
      const opts = optionsOrBefore as PushPatchOptions;
      bData = opts.beforeData;
      aData = opts.afterData;
      posX = opts.x ?? 0;
      posY = opts.y ?? 0;
      targetLayerId = opts.layerId;
      if (opts.description) desc = opts.description;
    } else {
      bData = optionsOrBefore as ImageData;
      aData = afterData!;
    }

    const resolvedLayerId = targetLayerId ?? this.context.getActiveLayer().id;

    const patchEntry = new CanvasStateHistoryEntry(
      resolvedLayerId,
      bData,
      aData,
      this.context,
      posX,
      posY,
      desc,
      "patch",
    );

    this.push(patchEntry);
  }

  private toSummary(entry: HistoryEntry, index: number): HistoryEntrySummary {
    if (typeof entry.getSummary === "function") {
      return entry.getSummary();
    }

    return {
      id: entry.id ?? `entry-${index + 1}`,
      type: entry.type ?? "custom",
      description: entry.description ?? "Canvas operation",
      timestamp: entry.timestamp ?? Date.now(),
    };
  }
}

export class CanvasStateHistoryEntry implements HistoryEntry {
  public id: string;
  public timestamp: number;

  constructor(
    private layerId: string,
    private beforeData: ImageData,
    private afterData: ImageData,
    private context: HistoryContext,
    private x: number = 0,
    private y: number = 0,
    public description: string = "Brush stroke",
    public type: string = "stroke",
  ) {
    this.id = `hist-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
  }

  getSummary(): HistoryEntrySummary {
    return {
      id: this.id,
      type: this.type,
      description: this.description,
      timestamp: this.timestamp,
      layerId: this.layerId,
      bounds: {
        x: this.x,
        y: this.y,
        width: this.beforeData.width,
        height: this.beforeData.height,
      },
    };
  }

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
  public id: string;
  public timestamp: number;
  public type = "layer-create";
  public description: string;

  constructor(
    private layer: Layer,
    private context: HistoryContext,
    private index?: number,
    description?: string,
  ) {
    this.id = `hist-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.description = description ?? `Create layer "${layer.name}"`;
  }

  getSummary(): HistoryEntrySummary {
    return {
      id: this.id,
      type: this.type,
      description: this.description,
      timestamp: this.timestamp,
      layerId: this.layer.id,
    };
  }

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
  public id: string;
  public timestamp: number;
  public type = "layer-delete";
  public description: string;

  constructor(
    private layer: Layer,
    private index: number,
    private wasActive: boolean,
    private context: HistoryContext,
    description?: string,
  ) {
    this.id = `hist-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.description = description ?? `Delete layer "${layer.name}"`;
  }

  getSummary(): HistoryEntrySummary {
    return {
      id: this.id,
      type: this.type,
      description: this.description,
      timestamp: this.timestamp,
      layerId: this.layer.id,
    };
  }

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
  public id: string;
  public timestamp: number;
  public type = "layer-property";
  public description: string;

  constructor(
    private layerId: string,
    private propertyName:
      | "name"
      | "visible"
      | "opacity"
      | "blendMode"
      | "alphaLock"
      | "locked",
    private beforeValue: string | number | boolean,
    private afterValue: string | number | boolean,
    private context: HistoryContext,
    description?: string,
  ) {
    this.id = `hist-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.description =
      description ?? `Change ${propertyName} on layer "${layerId}"`;
  }

  getSummary(): HistoryEntrySummary {
    return {
      id: this.id,
      type: this.type,
      description: this.description,
      timestamp: this.timestamp,
      layerId: this.layerId,
    };
  }

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
    } else if (this.propertyName === "alphaLock") {
      layer.alphaLock = this.beforeValue as boolean;
    } else if (this.propertyName === "locked") {
      layer.locked = this.beforeValue as boolean;
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
    } else if (this.propertyName === "alphaLock") {
      layer.alphaLock = this.afterValue as boolean;
    } else if (this.propertyName === "locked") {
      layer.locked = this.afterValue as boolean;
    }
    this.context.renderLayers();
  }
}

export class MoveLayerHistoryEntry implements HistoryEntry {
  public id: string;
  public timestamp: number;
  public type = "layer-move";
  public description: string;

  constructor(
    private layerId: string,
    private beforeIndex: number,
    private afterIndex: number,
    private context: HistoryContext,
    description?: string,
  ) {
    this.id = `hist-${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = Date.now();
    this.description = description ?? `Move layer "${layerId}"`;
  }

  getSummary(): HistoryEntrySummary {
    return {
      id: this.id,
      type: this.type,
      description: this.description,
      timestamp: this.timestamp,
      layerId: this.layerId,
    };
  }

  undo(): void {
    this.context.moveLayerOnly(this.layerId, this.beforeIndex);
    this.context.renderLayers();
  }

  redo(): void {
    this.context.moveLayerOnly(this.layerId, this.afterIndex);
    this.context.renderLayers();
  }
}
