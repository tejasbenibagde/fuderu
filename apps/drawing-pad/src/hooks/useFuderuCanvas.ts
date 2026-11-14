import { useCallback, useEffect, useRef, useState } from "react";
import {
  Canvas,
  DynamicShapeModule,
  DynamicTransparencyModule,
  SpreadModule,
  type BlendMode,
  type CanvasSnapshot,
  type FuderuDocument,
  type Layer,
  type SelectionMode,
} from "fuderu";
import type {
  StudioBrushState,
  StudioShapeOptions,
  StudioTool,
} from "../types/studio";

const INITIAL_BRUSH: StudioBrushState = {
  color: "#1e293b",
  size: 24,
  opacity: 1,
  flow: 0.9,
  spacing: 0.14,
  roundness: 1,
  angle: 0,
  smooth: true,
  spacingEnabled: true,
  pressureSimulation: false,
  rotationMode: "fixed",
  sizeJitter: 0,
  sizeJitterTrigger: "none",
  opacityJitter: 0,
  opacityJitterTrigger: "none",
  spreadRange: 0,
  spreadCount: 1,
  customTipName: null,
};

const INITIAL_SHAPE: StudioShapeOptions = {
  fill: true,
  stroke: true,
  strokeWidth: 4,
  cornerRadius: 8,
};

export interface StudioNotice {
  type: "info" | "error";
  message: string;
}

export function useFuderuCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const engineRef = useRef<Canvas | null>(null);
  const dynamicShapeRef = useRef<DynamicShapeModule | null>(null);
  const dynamicTransparencyRef = useRef<DynamicTransparencyModule | null>(null);
  const spreadRef = useRef<SpreadModule | null>(null);

  const [snapshot, setSnapshot] = useState<CanvasSnapshot | null>(null);
  const [layers, setLayers] = useState<readonly Layer[]>([]);
  const [brushState, setBrushState] = useState<StudioBrushState>(INITIAL_BRUSH);
  const [shapeOptions, setShapeOptions] =
    useState<StudioShapeOptions>(INITIAL_SHAPE);
  const [activeTool, setActiveTool] = useState<StudioTool>("brush");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("replace");
  const [zoom, setZoom] = useState<number>(0.65);
  const [actionCount, setActionCount] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayProgress, setReplayProgress] = useState<number>(0);
  const [notice, setNotice] = useState<StudioNotice | null>(null);
  const [previewTick, setPreviewTick] = useState<number>(0);

  const showNotice = useCallback(
    (type: StudioNotice["type"], message: string) => {
      setNotice({ type, message });
    },
    [],
  );

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const syncFromEngine = useCallback((engine: Canvas) => {
    setSnapshot(engine.getSnapshot());
    setLayers([...engine.getLayers()]);
    setActionCount(engine.getActionLog().length);
    setPreviewTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const engine = new Canvas({
      canvas: el,
      document: { width: 1200, height: 800 },
      pressureSimulation: INITIAL_BRUSH.pressureSimulation,
      brush: {
        color: INITIAL_BRUSH.color,
        size: INITIAL_BRUSH.size,
        opacity: INITIAL_BRUSH.opacity,
        flow: INITIAL_BRUSH.flow,
        spacing: INITIAL_BRUSH.spacing,
        roundness: INITIAL_BRUSH.roundness,
        angle: INITIAL_BRUSH.angle,
        eraser: false,
        rotation: { mode: INITIAL_BRUSH.rotationMode },
      },
    });

    const dynamicShape = new DynamicShapeModule();
    const dynamicTransparency = new DynamicTransparencyModule();
    const spread = new SpreadModule();

    engine.brush.useModule(dynamicShape);
    engine.brush.useModule(dynamicTransparency);
    engine.brush.useModule(spread);

    engineRef.current = engine;
    dynamicShapeRef.current = dynamicShape;
    dynamicTransparencyRef.current = dynamicTransparency;
    spreadRef.current = spread;

    syncFromEngine(engine);

    const unsubChange = engine.on("change", () => syncFromEngine(engine));
    const unsubStrokeEnd = engine.on("stroke:end", () =>
      syncFromEngine(engine),
    );
    const unsubAction = engine.on("action:record", () => {
      setActionCount(engine.getActionLog().length);
    });
    const unsubSelection = engine.on("selection:change", () =>
      syncFromEngine(engine),
    );
    const unsubTransformStart = engine.on("transform:start", () =>
      syncFromEngine(engine),
    );
    const unsubTransformChange = engine.on("transform:change", () =>
      syncFromEngine(engine),
    );
    const unsubTransformEnd = engine.on("transform:end", () =>
      syncFromEngine(engine),
    );

    return () => {
      unsubChange();
      unsubStrokeEnd();
      unsubAction();
      unsubSelection();
      unsubTransformStart();
      unsubTransformChange();
      unsubTransformEnd();
      engine.destroy();
      engineRef.current = null;
    };
  }, [canvasRef, syncFromEngine]);

  // Keep eraser flag synced when switching between brush & eraser tools
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setEraser(activeTool === "eraser");
  }, [activeTool]);

  const updateBrush = useCallback((patch: Partial<StudioBrushState>) => {
    const engine = engineRef.current;
    setBrushState((prev) => {
      const next = { ...prev, ...patch };
      if (engine) {
        engine.loadConfig({
          color: next.color,
          size: next.size,
          opacity: next.opacity,
          flow: next.flow,
          spacing: next.spacing,
          roundness: next.roundness,
          angle: next.angle,
          rotation: { mode: next.rotationMode },
        });
        engine.setSmooth(next.smooth);
        engine.setSpacing(next.spacingEnabled);
        engine.pressureSimulation = next.pressureSimulation;

        if (dynamicShapeRef.current) {
          dynamicShapeRef.current.config.sizeJitter = next.sizeJitter;
          dynamicShapeRef.current.config.sizeJitterTrigger =
            next.sizeJitterTrigger;
        }
        if (dynamicTransparencyRef.current) {
          dynamicTransparencyRef.current.config.opacityJitter =
            next.opacityJitter;
          dynamicTransparencyRef.current.config.opacityJitterTrigger =
            next.opacityJitterTrigger;
        }
        if (spreadRef.current) {
          spreadRef.current.config.spreadRange = next.spreadRange;
          spreadRef.current.config.count = next.spreadCount;
        }
      }
      return next;
    });
  }, []);

  const loadBrushTip = useCallback(
    async (file: File) => {
      const engine = engineRef.current;
      if (!engine) return;
      const url = URL.createObjectURL(file);
      try {
        await engine.loadImage(url);
        setBrushState((prev) => ({ ...prev, customTipName: file.name }));
        showNotice("info", `Loaded brush tip "${file.name}".`);
      } catch {
        showNotice("error", "Could not load brush image file.");
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [showNotice],
  );

  const clearBrushTip = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.brush.removeImage();
    setBrushState((prev) => ({ ...prev, customTipName: null }));
    showNotice("info", "Restored circular brush tip.");
  }, [showNotice]);

  const runGuarded = useCallback(
    (action: (engine: Canvas) => void) => {
      const engine = engineRef.current;
      if (!engine) return;
      try {
        action(engine);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Operation could not complete.";
        showNotice("error", message);
      }
    },
    [showNotice],
  );

  const selectTool = useCallback(
    (tool: StudioTool) => {
      const engine = engineRef.current;
      if (tool === "transform" && engine && !engine.isTransforming()) {
        try {
          engine.beginTransform();
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Could not begin transform session.";
          showNotice("error", message);
          return;
        }
      } else if (tool !== "transform" && engine && engine.isTransforming()) {
        engine.commitTransform();
      }
      setActiveTool(tool);
    },
    [showNotice],
  );

  const createLayer = useCallback(() => {
    runGuarded((engine) => {
      const count = engine.getLayers().length + 1;
      engine.createLayer(`Layer ${count}`);
    });
  }, [runGuarded]);

  const setActiveLayer = useCallback(
    (layerId: string) => {
      runGuarded((engine) => engine.setActiveLayer(layerId));
    },
    [runGuarded],
  );

  const toggleLayerVisibility = useCallback(
    (layer: Layer) => {
      runGuarded((engine) =>
        engine.updateLayer(layer.id, { visible: !layer.visible }),
      );
    },
    [runGuarded],
  );

  const toggleAlphaLock = useCallback(
    (layer: Layer) => {
      runGuarded((engine) =>
        engine.updateLayer(layer.id, { alphaLock: !layer.alphaLock }),
      );
    },
    [runGuarded],
  );

  const toggleLayerLock = useCallback(
    (layer: Layer) => {
      runGuarded((engine) =>
        engine.updateLayer(layer.id, { locked: !layer.locked }),
      );
    },
    [runGuarded],
  );

  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number) => {
      runGuarded((engine) => engine.updateLayer(layerId, { opacity }));
    },
    [runGuarded],
  );

  const setLayerBlendMode = useCallback(
    (layerId: string, blendMode: BlendMode) => {
      runGuarded((engine) => engine.updateLayer(layerId, { blendMode }));
    },
    [runGuarded],
  );

  const renameLayer = useCallback(
    (layerId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      runGuarded((engine) => engine.updateLayer(layerId, { name: trimmed }));
    },
    [runGuarded],
  );

  const moveLayer = useCallback(
    (layerId: string, delta: number) => {
      runGuarded((engine) => {
        const list = engine.getLayers();
        const currentIndex = list.findIndex((l) => l.id === layerId);
        if (currentIndex < 0) return;
        const target = Math.max(
          0,
          Math.min(list.length - 1, currentIndex + delta),
        );
        if (target !== currentIndex) {
          engine.moveLayer(layerId, target);
        }
      });
    },
    [runGuarded],
  );

  const duplicateLayer = useCallback(
    (layerId: string) => {
      runGuarded((engine) => engine.duplicateLayer(layerId));
    },
    [runGuarded],
  );

  const deleteLayer = useCallback(
    (layerId: string) => {
      runGuarded((engine) => engine.deleteLayer(layerId));
    },
    [runGuarded],
  );

  const undo = useCallback(() => {
    runGuarded((engine) => engine.undo());
  }, [runGuarded]);

  const redo = useCallback(() => {
    runGuarded((engine) => engine.redo());
  }, [runGuarded]);

  const clearActiveLayer = useCallback(() => {
    runGuarded((engine) => engine.clearActiveLayer());
  }, [runGuarded]);

  const resetArtwork = useCallback(() => {
    runGuarded((engine) => {
      engine.resetArtwork();
      setActiveTool("brush");
      showNotice("info", "Canvas reset while preserving recorded actions.");
    });
  }, [runGuarded, showNotice]);

  const resizeDocument = useCallback(
    (width: number, height: number) => {
      runGuarded((engine) => {
        engine.setDocumentSize(width, height, false);
        showNotice("info", `Document resized to ${width} × ${height} px.`);
      });
    },
    [runGuarded, showNotice],
  );

  const copySelection = useCallback(() => {
    runGuarded((engine) => {
      const copied = engine.copy();
      if (!copied) {
        showNotice("info", "Nothing to copy on the active layer.");
        return;
      }
      showNotice(
        "info",
        `Copied ${copied.width} × ${copied.height} px to clipboard.`,
      );
    });
  }, [runGuarded, showNotice]);

  const cutSelection = useCallback(() => {
    runGuarded((engine) => {
      const cut = engine.cut();
      if (!cut) {
        showNotice("info", "Nothing to cut on the active layer.");
        return;
      }
      showNotice("info", `Cut ${cut.width} × ${cut.height} px to clipboard.`);
    });
  }, [runGuarded, showNotice]);

  const pasteClipboard = useCallback(
    (createLayer = true) => {
      runGuarded((engine) => {
        const res = engine.paste({
          createLayer,
          newLayerName: "Pasted Layer",
          asSelection: true,
        });
        if (!res) {
          showNotice("info", "Clipboard is empty.");
          return;
        }
        showNotice("info", `Pasted ${res.width} × ${res.height} px.`);
      });
    },
    [runGuarded, showNotice],
  );

  const replayActions = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine || isReplaying) return;
    const log = engine.getActionLog();
    if (log.length === 0) {
      showNotice("info", "No recorded actions to replay yet.");
      return;
    }

    setIsReplaying(true);
    setReplayProgress(0);
    setActiveTool("brush");
    try {
      engine.resetArtwork();
      await engine.replay(log, {
        delayMs: 16,
        onProgress: (completed, total) => {
          setReplayProgress(
            total > 0 ? Math.round((completed / total) * 100) : 0,
          );
        },
      });
      syncFromEngine(engine);
      showNotice("info", `Replayed ${log.length} recorded actions.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Replay failed.";
      showNotice("error", msg);
    } finally {
      setIsReplaying(false);
    }
  }, [isReplaying, showNotice, syncFromEngine]);

  const exportPNG = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const dataUrl = await engine.exportPNG({ includeBackground: false });
    const link = document.createElement("a");
    link.download = `fuderu-artwork-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showNotice("info", "Exported PNG artwork.");
  }, [showNotice]);

  const exportJSON = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const doc = await engine.exportDocument();
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `fuderu-project-${Date.now()}.fuderu.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("info", "Saved .fuderu.json project file.");
  }, [showNotice]);

  const importJSON = useCallback(
    async (file: File) => {
      const engine = engineRef.current;
      if (!engine) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as FuderuDocument;
        await engine.importDocument(parsed);
        syncFromEngine(engine);
        showNotice("info", `Imported "${file.name}".`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Invalid Fuderu JSON document.";
        showNotice("error", msg);
      }
    },
    [showNotice, syncFromEngine],
  );

  return {
    engineRef,
    snapshot,
    layers,
    brushState,
    shapeOptions,
    setShapeOptions,
    activeTool,
    selectTool,
    selectionMode,
    setSelectionMode,
    zoom,
    setZoom,
    actionCount,
    isReplaying,
    replayProgress,
    notice,
    showNotice,
    clearNotice,
    previewTick,
    updateBrush,
    loadBrushTip,
    clearBrushTip,
    createLayer,
    setActiveLayer,
    toggleLayerVisibility,
    toggleAlphaLock,
    toggleLayerLock,
    setLayerOpacity,
    setLayerBlendMode,
    renameLayer,
    moveLayer,
    duplicateLayer,
    deleteLayer,
    undo,
    redo,
    clearActiveLayer,
    resetArtwork,
    resizeDocument,
    copySelection,
    cutSelection,
    pasteClipboard,
    replayActions,
    exportPNG,
    exportJSON,
    importJSON,
    syncFromEngine,
  };
}
