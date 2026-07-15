// src/LayerManager.ts

import { Layer } from "./Layer";
import type { BlendMode } from "./types/layers";

export interface CreateLayerOptions {
  id?: string;
  name?: string;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
}

export interface UpdateLayerOptions {
  name?: string;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
}

export class LayerManager {
  private layers: Layer[] = [];
  private activeLayerId: string | null = null;

  constructor(width: number, height: number) {
    const baseLayer = new Layer({
      name: "Background",
      width,
      height,
    });

    this.layers.push(baseLayer);
    this.activeLayerId = baseLayer.id;
  }

  getAll(): readonly Layer[] {
    return this.layers;
  }

  getActive(): Layer {
    const layer = this.layers.find((l) => l.id === this.activeLayerId);

    if (!layer) {
      throw new Error("No active layer");
    }

    return layer;
  }

  getActiveId(): string | null {
    return this.activeLayerId;
  }

  setActive(layerId: string): void {
    this.getById(layerId);
    this.activeLayerId = layerId;
  }

  createLayer(options: CreateLayerOptions | string = {}): Layer {
    const reference = this.layers[0];
    const layerOptions =
      typeof options === "string" ? { name: options } : options;

    const layer = new Layer({
      id: layerOptions.id,
      name: layerOptions.name ?? "Layer",
      width: reference.canvas.width,
      height: reference.canvas.height,
      visible: layerOptions.visible,
      opacity: layerOptions.opacity,
      blendMode: layerOptions.blendMode,
    });

    this.layers.push(layer);
    this.activeLayerId = layer.id;

    return layer;
  }

  deleteLayer(layerId: string): void {
    if (this.layers.length === 1) {
      throw new Error("Cannot delete the last layer");
    }

    const layerIndex = this.layers.findIndex((layer) => layer.id === layerId);

    if (layerIndex === -1) {
      throw new Error("Layer not found");
    }

    this.layers.splice(layerIndex, 1);

    if (this.activeLayerId === layerId) {
      const fallbackIndex = Math.min(layerIndex, this.layers.length - 1);
      this.activeLayerId = this.layers[fallbackIndex].id;
    }
  }

  addLayerAt(layer: Layer, index: number): void {
    const boundedIndex = Math.min(Math.max(index, 0), this.layers.length);
    this.layers.splice(boundedIndex, 0, layer);
  }

  removeLayerOnly(layerId: string): void {
    const layerIndex = this.layers.findIndex((layer) => layer.id === layerId);
    if (layerIndex !== -1) {
      this.layers.splice(layerIndex, 1);
      if (this.activeLayerId === layerId && this.layers.length > 0) {
        this.activeLayerId = this.layers[0].id;
      }
    }
  }

  duplicateLayer(layerId: string): Layer {
    const source = this.layers.find((l) => l.id === layerId);

    if (!source) {
      throw new Error("Layer not found");
    }

    const duplicate = new Layer({
      name: `${source.name} Copy`,
      width: source.canvas.width,
      height: source.canvas.height,
    });

    duplicate.ctx.drawImage(source.canvas, 0, 0);

    duplicate.opacity = source.opacity;
    duplicate.visible = source.visible;
    duplicate.blendMode = source.blendMode;

    const sourceIndex = this.layers.indexOf(source);
    this.layers.splice(sourceIndex + 1, 0, duplicate);
    this.activeLayerId = duplicate.id;

    return duplicate;
  }

  moveLayer(layerId: string, targetIndex: number): void {
    const currentIndex = this.layers.findIndex((l) => l.id === layerId);

    if (currentIndex === -1) {
      throw new Error("Layer not found");
    }

    const boundedTargetIndex = Math.min(
      Math.max(targetIndex, 0),
      this.layers.length - 1,
    );

    const [layer] = this.layers.splice(currentIndex, 1);

    this.layers.splice(boundedTargetIndex, 0, layer);
  }

  updateLayer(layerId: string, options: UpdateLayerOptions): Layer {
    const layer = this.getById(layerId);

    if (options.name !== undefined) layer.name = options.name;
    if (options.visible !== undefined) layer.visible = options.visible;
    if (options.opacity !== undefined) layer.setOpacity(options.opacity);
    if (options.blendMode !== undefined) layer.blendMode = options.blendMode;

    return layer;
  }

  getById(layerId: string): Layer {
    const layer = this.layers.find((l) => l.id === layerId);

    if (!layer) {
      throw new Error(`Layer ${layerId} not found`);
    }

    return layer;
  }

  resize(width: number, height: number): void {
    for (const layer of this.layers) {
      layer.resize(width, height);
    }
  }

  clear(): void {
    for (const layer of this.layers) {
      layer.clear();
    }
  }

  clearActiveLayer(): void {
    this.getActive().clear();
  }
}
