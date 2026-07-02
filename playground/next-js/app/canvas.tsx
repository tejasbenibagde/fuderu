"use client";

import {
  type PointerEvent as ReactPointerEffect,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Brush,
  DynamicShapeModule,
  DynamicTransparencyModule,
  MousePressure,
  PatternModule,
  SpreadModule,
  Layer,
  LayerManager,
} from "fuderu";

import { useBrushStore } from "@/components/playground/brush-store";
import { Button } from "@/components/ui/button";
import {
  IconArrowsMaximize,
  IconRotateClockwise,
  IconRotate,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import type { PlaygroundProject } from "./page";

type ModuleRefs = {
  dynamicShape: DynamicShapeModule;
  dynamicTransparency: DynamicTransparencyModule;
  spread: SpreadModule;
  pattern: PatternModule;
};

const Canvas = ({ project }: { project: PlaygroundProject }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const brushRef = useRef<Brush | null>(null);
  const modulesRef = useRef<ModuleRefs | null>(null);
  const pressureRef = useRef(new MousePressure());
  const isDrawingRef = useRef(false);
  const layerManagerRef = useRef<LayerManager | null>(null);
  const [cursor, setCursor] = useState({
    visible: false,
    x: 0,
    y: 0,
    size: 24,
  });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const store = useBrushStore();

  // Composite all layers onto the display canvas
  const compositeLayers = () => {
    const displayCanvas = canvasRef.current;
    if (!displayCanvas) return;
    const ctx = displayCanvas.getContext("2d");
    if (!ctx) return;
    const layerManager = layerManagerRef.current;
    if (!layerManager) return;

    const layers = layerManager.getAll();
    // Clear the display canvas
    ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    // Draw each layer in order
    for (const layer of layers) {
      ctx.drawImage(layer.canvas, 0, 0);
    }
  };

  // Initialize or reset the layer manager and brush when project size changes
  useEffect(() => {
    const layerManager = new LayerManager(project.width, project.height);
    layerManagerRef.current = layerManager;

    // Create brush on the active layer's canvas
    const activeLayer = layerManager.getActive();
    const brush = new Brush(activeLayer.canvas, {
      size: store.size,
      opacity: store.opacity,
      color: store.color,
      spacing: store.spacing,
      flow: store.flow,
      roundness: store.roundness,
      angle: store.angle,
      eraser: store.eraser,
      rotation: {
        mode: store.rotationMode,
        offset: store.rotationOffset * Math.PI,
        jitter: store.rotationJitter * Math.PI,
        smoothing: store.rotationSmoothing,
      },
    });

    // Initialize modules
    const dynamicShape = new DynamicShapeModule();
    const dynamicTransparency = new DynamicTransparencyModule();
    const spread = new SpreadModule({ spreadRange: 0 });
    const pattern = new PatternModule();

    brush.useModule(dynamicShape);
    brush.useModule(dynamicTransparency);
    brush.useModule(spread);
    brush.useModule(pattern);

    brush.isSmooth = store.smooth;
    brush.isSpacing = store.spacingEnabled;
    brush.isEraser = store.eraser;

    brushRef.current = brush;
    modulesRef.current = {
      dynamicShape,
      dynamicTransparency,
      spread,
      pattern,
    };

    // Initial composition
    compositeLayers();

    return () => {
      brushRef.current = null;
      modulesRef.current = null;
      layerManagerRef.current = null;
    };
  }, [project.width, project.height, store]);

  // Update brush configuration when store changes
  useEffect(() => {
    const brush = brushRef.current;
    if (!brush) return;

    brush.loadConfig({
      size: store.size,
      opacity: store.opacity,
      color: store.color,
      spacing: store.spacing,
      flow: store.flow,
      roundness: store.roundness,
      angle: store.angle,
      eraser: store.eraser,
      rotation: {
        mode: store.rotationMode,
        offset: store.rotationOffset * Math.PI,
        jitter: store.rotationJitter * Math.PI,
        smoothing: store.rotationSmoothing,
      },
    });

    brush.isSmooth = store.smooth;
    brush.isSpacing = store.spacingEnabled;
    brush.isEraser = store.eraser;
  }, [
    store.size,
    store.opacity,
    store.color,
    store.spacing,
    store.flow,
    store.roundness,
    store.angle,
    store.eraser,
    store.smooth,
    store.spacingEnabled,
    store.pressureSimulation,
    store.rotationMode,
    store.rotationOffset,
    store.rotationJitter,
    store.rotationSmoothing,
  ]);

  // Update module configurations
  useEffect(() => {
    const modules = modulesRef.current;
    if (!modules) return;

    modules.dynamicShape.bindConfig({
      sizeJitter: store.dynamicShapeEnabled ? store.sizeJitter : 0,
      sizeJitterTrigger: store.sizeJitterTrigger,
      minDiameter: store.minDiameter,
      angleJitter: store.dynamicShapeEnabled ? store.angleJitter : 0,
      angleJitterTrigger: store.angleJitterTrigger,
      roundJitter: store.dynamicShapeEnabled ? store.roundJitter : 0,
      roundJitterTrigger: store.roundJitterTrigger,
      minRoundness: store.minRoundness,
    });
  }, [
    store.dynamicShapeEnabled,
    store.sizeJitter,
    store.sizeJitterTrigger,
    store.minDiameter,
    store.angleJitter,
    store.angleJitterTrigger,
    store.roundJitter,
    store.roundJitterTrigger,
    store.minRoundness,
  ]);

  useEffect(() => {
    const modules = modulesRef.current;
    if (!modules) return;

    modules.dynamicTransparency.bindConfig({
      opacityJitter: store.dynamicTransparencyEnabled ? store.opacityJitter : 0,
      opacityJitterTrigger: store.opacityJitterTrigger,
      minOpacityJitter: store.minOpacityJitter,
      flowJitter: store.dynamicTransparencyEnabled ? store.flowJitter : 0,
      flowJitterTrigger: store.flowJitterTrigger,
      minFlowJitter: store.minFlowJitter,
    });
  }, [
    store.dynamicTransparencyEnabled,
    store.opacityJitter,
    store.opacityJitterTrigger,
    store.minOpacityJitter,
    store.flowJitter,
    store.flowJitterTrigger,
    store.minFlowJitter,
  ]);

  useEffect(() => {
    const modules = modulesRef.current;
    if (!modules) return;

    modules.spread.bindConfig({
      spreadRange: store.spreadEnabled ? store.spreadRange : 0,
      spreadTrigger: store.spreadTrigger,
      count: store.spreadCount,
      countJitter: store.spreadCountJitter,
      countJitterTrigger: store.spreadCountJitterTrigger,
    });
  }, [
    store.spreadEnabled,
    store.spreadRange,
    store.spreadTrigger,
    store.spendCount,
    store.spendCountJitter,
    store.spendCountJitterTrigger,
  ]);

  useEffect(() => {
    const modules = modulesRef.current;
    if (!modules) return;

    modules.pattern.bindConfig({
      scale: store.patternScale,
      brightness: store.patternBrightness,
      contrast: store.patternContrast,
      blendMode: "source-over",
    });

    if (!store.patternEnabled || !store.patternImage) {
      modules.pattern.removePattern();
      return;
    }

    modules.pattern.loadPattern(
      store.patternImage,
      canvasRef.current?.width ?? 0,
      canvasRef.current?.height ?? 0,
      store.patternTint,
    );
  }, [
    store.patternEnabled,
    store.patternImage,
    store.patternScale,
    store.patternBrightness,
    store.patternContrast,
    store.patternTint,
  ]);

  useEffect(() => {
    if (store.clearTrigger === 0) return;
    brushRef.current?.clear();
    compositeLayers();
  }, [store.clearTrigger]);

  useEffect(() => {
    if (store.undoTrigger === 0) return;
    brushRef.current?.undo();
    compositeLayers();
  }, [store.undoTrigger]);

  useEffect(() => {
    if (store.redoTrigger === 0) return;
    brushRef.current?.redo();
    compositeLayers();
  }, [store.redoTrigger]);

  const updateCursor = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const canvasRect = canvas.getBoundingClientRect();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = canvasRect.left + canvasRect.width / 2;
    const centerY = canvasRect.top + canvasRect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const angle = (rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const localX = (dx * cos + dy * sin) / zoom + width / 2;
    const localY = (-dx * sin + dy * cos) / zoom + height / 2;
    const x = (localX * canvas.width) / width;
    const y = (localY * canvas.height) / height;
    const hasRealPressure = event.pointerType === "pen" && event.pressure > 0;
    const pressure = hasRealPressure
      ? event.pressure
      : store.pressureSimulation
        ? pressureRef.current.getPressure(x, y)
        : 1;

    const surface = surfaceRef.current;
    const surfaceRect = surface?.getBoundingClientRect();

    setCursor({
      visible: true,
      x: surfaceRect ? event.clientX - surfaceRect.left : localX,
      y: surfaceRect ? event.clientY - surfaceRect.top : localY,
      size: Math.max(8, store.size * 2 * Math.min(1, 1 / zoom)),
    });

    return { x, y, pressure };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const brush = brushRef.current;
    if (!brush) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    pressureRef.current.reset();

    const point = updateCursor(event);
    if (!point) return;

    brush.putPoint(point.x, point.y, point.pressure);
    brush.render();
    compositeLayers();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const brush = brushRef.current;
    const point = updateCursor(event);
    if (!brush || !point || !isDrawingRef.current) return;

    event.preventDefault();
    brush.putPoint(point.x, point.y, point.pressure);
    brush.render();
    compositeLayers();
  };

  const clampZoom = (nextZoom: number) => Math.min(2, Math.max(0.25, nextZoom));

  const zoomIn = () => setZoom((value) => clampZoom(value + 0.1));
  const zoomOut = () => setZoom((value) => clampZoom(value - 0.1));
  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };
  const rotateLeft = () => setRotation((value) => (value - 90 + 360) % 360);
  const rotateRight = () => setRotation((value) => (value + 90) % 360);

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    event.preventDefault();
    isDrawingRef.current = false;
    pressureRef.current.reset();
    brushRef.current?.finalizeStroke();
    compositeLayers();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-muted/30">
      <div
        ref={surfaceRef}
        className="relative flex min-h-0 h-full w-full items-center justify-center overflow-auto rounded-lg border bg-muted/20"
      >
        <div className="absolute right-4 top-4 z-20 flex flex-wrap items-center gap-2 rounded-xl bg-muted/80 p-2 shadow-lg backdrop-blur-md">
          <Button size="icon" variant="outline" onClick={zoomOut}>
            <IconZoomOut />
          </Button>
          <Button size="icon" variant="outline" onClick={zoomIn}>
            <IconZoomIn />
          </Button>
          <Button size="icon" variant="outline" onClick={resetView}>
            <IconArrowsMaximize />
          </Button>
          <Button size="icon" variant="outline" onClick={rotateLeft}>
            <IconRotate />
          </Button>
          <Button size="icon" variant="outline" onClick={rotateRight}>
            <IconRotateClockwise />
          </Button>
          <div className="text-xs text-muted-foreground">
            {Math.round(zoom * 100)}% · {rotation}°
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="cursor-none rounded-md border bg-background shadow-sm"
          style={{
            aspectRatio: `${project.width} / ${project.height}`,
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onPointerEnter={updateCursor}
          onPointerLeave={() => {
            if (!isDrawingRef.current) {
              setCursor((value) => ({ ...value, visible: false }));
            }
          }}
        />
        {cursor.visible && (
          <div
            className="pointer-events-none absolute z-10 rounded-full border border-foreground/80 bg-background/10 shadow-[0_0_0_1px_rgba(255,255,255,0.75),0_8px_24px_rgba(0,0,0,0.12)] mix-blend-difference"
            style={{
              width: cursor.size,
              height: cursor.size,
              left: cursor.x,
              top: cursor.y,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Canvas;
