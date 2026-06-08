// src/LayerManager.ts

import { Layer } from "./Layer";

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

  setActive(layerId: string): void {
    const exists = this.layers.some((l) => l.id === layerId);

    if (!exists) {
      throw new Error(`Layer ${layerId} not found`);
    }

    this.activeLayerId = layerId;
  }

  createLayer(name = "Layer"): Layer {
    const reference = this.layers[0];

    const layer = new Layer({
      name,
      width: reference.canvas.width,
      height: reference.canvas.height,
    });

    this.layers.push(layer);

    return layer;
  }

  deleteLayer(layerId: string): void {
    if (this.layers.length === 1) {
      throw new Error("Cannot delete the last layer");
    }

    this.layers = this.layers.filter((layer) => layer.id !== layerId);

    if (this.activeLayerId === layerId) {
      this.activeLayerId = this.layers[0].id;
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

    this.layers.push(duplicate);

    return duplicate;
  }

  moveLayer(layerId: string, targetIndex: number): void {
    const currentIndex = this.layers.findIndex((l) => l.id === layerId);

    if (currentIndex === -1) {
      throw new Error("Layer not found");
    }

    const [layer] = this.layers.splice(currentIndex, 1);

    this.layers.splice(targetIndex, 0, layer);
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
}
