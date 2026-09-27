// src/Clipboard.ts

import type { ClipboardData, ClipboardSnapshot } from "./types/clipboard";

/**
 * Manages in-memory clipboard data for raster selections and layer regions.
 * Operates as a shared store allowing copy, cut, and paste operations across
 * multiple layers and separate Canvas instances.
 */
export class ClipboardStore {
  private static currentData: ClipboardData | null = null;
  private static readonly listeners: Set<() => void> = new Set();

  private static readonly INACTIVE_SNAPSHOT: ClipboardSnapshot = Object.freeze({
    hasData: false,
  });

  /**
   * Sets the active clipboard data and notifies listeners.
   */
  public static set(data: ClipboardData): void {
    ClipboardStore.currentData = Object.freeze({
      ...data,
      timestamp: data.timestamp || Date.now(),
    });
    ClipboardStore.notify();
  }

  /**
   * Retrieves the current clipboard data or null if empty.
   */
  public static get(): ClipboardData | null {
    return ClipboardStore.currentData;
  }

  /**
   * Returns whether clipboard currently contains data.
   */
  public static has(): boolean {
    return ClipboardStore.currentData !== null;
  }

  /**
   * Clears the current clipboard data.
   */
  public static clear(): void {
    if (ClipboardStore.currentData !== null) {
      ClipboardStore.currentData = null;
      ClipboardStore.notify();
    }
  }

  /**
   * Returns an immutable snapshot of current clipboard state for external subscribers.
   */
  public static getSnapshot(): ClipboardSnapshot {
    if (!ClipboardStore.currentData) {
      return ClipboardStore.INACTIVE_SNAPSHOT;
    }
    return Object.freeze({
      hasData: true,
      width: ClipboardStore.currentData.width,
      height: ClipboardStore.currentData.height,
      timestamp: ClipboardStore.currentData.timestamp,
    });
  }

  /**
   * Subscribe to clipboard store changes.
   */
  public static subscribe(listener: () => void): () => void {
    ClipboardStore.listeners.add(listener);
    return () => {
      ClipboardStore.listeners.delete(listener);
    };
  }

  private static notify(): void {
    for (const listener of ClipboardStore.listeners) {
      try {
        listener();
      } catch (err) {
        console.error("[ClipboardStore] Error in listener:", err);
      }
    }
  }

  /**
   * Converts ClipboardData into an image Blob (PNG format).
   */
  public static async toBlob(data: ClipboardData): Promise<Blob | null> {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, data.width);
    canvas.height = Math.max(1, data.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.putImageData(data.imageData, 0, 0);

    return new Promise<Blob | null>((resolve) => {
      if (typeof canvas.toBlob === "function") {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Creates ClipboardData from an image Blob.
   */
  public static async fromBlob(
    blob: Blob,
    x = 0,
    y = 0,
  ): Promise<ClipboardData | null> {
    if (typeof document === "undefined" || typeof Image === "undefined") {
      return null;
    }

    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, img.naturalWidth || img.width);
      canvas.height = Math.max(1, img.naturalHeight || img.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      return {
        width: canvas.width,
        height: canvas.height,
        x,
        y,
        imageData,
        timestamp: Date.now(),
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
