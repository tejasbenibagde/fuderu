"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LayerManager, Layer } from "fuderu";

export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  index: number;
  layer: Layer;
}

export function useLayerManager(width: number, height: number) {
  const managerRef = useRef<LayerManager | null>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>("");

  // Initialize layer manager
  useEffect(() => {
    const manager = new LayerManager(width, height);
    managerRef.current = manager;
    updateLayersList();
  }, [width, height]);

  const updateLayersList = useCallback(() => {
    if (!managerRef.current) return;

    const allLayers = managerRef.current.getAll();
    const layerInfos: LayerInfo[] = [];

    allLayers.forEach((layer, index) => {
      layerInfos.push({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        index,
        layer,
      });
    });

    setLayers(layerInfos.reverse()); // Show newest layers at top

    // Set active layer if not already set
    const activeId = managerRef.current?.getActiveId();
    if (activeId && !activeLayerId) {
      setActiveLayerId(activeId);
    }
  }, []);

  const createLayer = useCallback(() => {
    if (!managerRef.current) return null;

    const newLayer = managerRef.current.createLayer();
    setActiveLayerId(newLayer.id);
    updateLayersList();

    return newLayer.id;
  }, [updateLayersList]);

  const deleteLayer = useCallback(
    (layerId: string) => {
      if (!managerRef.current) return;

      // Don't delete if it's the last layer
      if (managerRef.current.getAll().length <= 1) return;

      try {
        managerRef.current.deleteLayer(layerId);

        // Set active layer to the new active one
        const activeId = managerRef.current.getActiveId();
        if (activeId) {
          setActiveLayerId(activeId);
        }

        updateLayersList();
      } catch {
        // Layer not found or can't delete
      }
    },
    [updateLayersList],
  );

  const renameLayer = useCallback(
    (layerId: string, name: string) => {
      if (!managerRef.current) return;

      const layer = managerRef.current.getAll().find((l) => l.id === layerId);
      if (layer) {
        layer.name = name || "Untitled";
        updateLayersList();
      }
    },
    [updateLayersList],
  );

  const setLayerVisibility = useCallback(
    (layerId: string, visible: boolean) => {
      if (!managerRef.current) return;

      const layer = managerRef.current.getAll().find((l) => l.id === layerId);
      if (layer) {
        layer.visible = visible;
        updateLayersList();
      }
    },
    [updateLayersList],
  );

  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number) => {
      if (!managerRef.current) return;

      const layer = managerRef.current.getAll().find((l) => l.id === layerId);
      if (layer) {
        layer.opacity = Math.max(0, Math.min(1, opacity));
        updateLayersList();
      }
    },
    [updateLayersList],
  );

  const setActiveLayer = useCallback((layerId: string) => {
    if (!managerRef.current) return;

    try {
      managerRef.current.setActive(layerId);
      setActiveLayerId(layerId);
    } catch {
      // Layer not found
    }
  }, []);

  const getActiveLayer = useCallback(() => {
    if (!managerRef.current) return null;
    return managerRef.current.getActive();
  }, []);

  const getLayerManager = useCallback(() => {
    return managerRef.current;
  }, []);

  return {
    layers,
    activeLayerId,
    createLayer,
    deleteLayer,
    renameLayer,
    setLayerVisibility,
    setLayerOpacity,
    setActiveLayer,
    getActiveLayer,
    getLayerManager,
    updateLayersList,
  };
}
