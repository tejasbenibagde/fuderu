"use client";

import {
  type PointerEvent as ReactPointerEvent,
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
} from "fuderu";

import { useBrushStore } from "@/components/playground/brush-store";
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
  const [cursor, setCursor] = useState({
    visible: false,
    x: 0,
    y: 0,
    size: 24,
  });

  const store = useBrushStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initialState = useBrushStore.getState();

    canvas.width = project.width;
    canvas.height = project.height;
    canvas.style.touchAction = "none";
    canvas.style.userSelect = "none";

    const dynamicShape = new DynamicShapeModule();
    const dynamicTransparency = new DynamicTransparencyModule();
    const spread = new SpreadModule({ spreadRange: 0 });
    const pattern = new PatternModule();

    const brush = new Brush(canvas, {
      size: initialState.size,
      opacity: initialState.opacity,
      color: initialState.color,
      spacing: initialState.spacing,
      flow: initialState.flow,
      roundness: initialState.roundness,
      angle: initialState.angle,
      eraser: initialState.eraser,
      rotation: {
        mode: initialState.rotationMode,
        offset: initialState.rotationOffset * Math.PI,
        jitter: initialState.rotationJitter * Math.PI,
        smoothing: initialState.rotationSmoothing,
      },
    });

    brush.useModule(dynamicShape);
    brush.useModule(dynamicTransparency);
    brush.useModule(spread);
    brush.useModule(pattern);

    brush.isSmooth = initialState.smooth;
    brush.isSpacing = initialState.spacingEnabled;
    brush.isEraser = initialState.eraser;

    brushRef.current = brush;
    modulesRef.current = {
      dynamicShape,
      dynamicTransparency,
      spread,
      pattern,
    };

    return () => {
      brushRef.current = null;
      modulesRef.current = null;
    };
  }, [project.height, project.width]);

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
    store.spreadCount,
    store.spreadCountJitter,
    store.spreadCountJitterTrigger,
  ]);

  useEffect(() => {
    const brush = brushRef.current;

    if (!brush) return;

    if (!store.image) {
      brush.removeImage();
      return;
    }

    void brush.loadImageAsync(store.image);
  }, [store.image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const modules = modulesRef.current;

    if (!canvas || !modules) return;

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
      canvas.width,
      canvas.height,
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
    brushRef.current?.clear();
  }, [store.clearTrigger]);

  useEffect(() => {
    if (store.undoTrigger === 0) return;

    brushRef.current?.undo();
  }, [store.undoTrigger]);

  useEffect(() => {
    if (store.redoTrigger === 0) return;

    brushRef.current?.redo();
  }, [store.redoTrigger]);

  const updateCursor = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const surface = surfaceRef.current;
    if (!canvas || !surface) return null;

    const canvasRect = canvas.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const x = (event.clientX - canvasRect.left) * scaleX;
    const y = (event.clientY - canvasRect.top) * scaleY;
    const hasRealPressure = event.pointerType === "pen" && event.pressure > 0;
    const pressure = hasRealPressure
      ? event.pressure
      : store.pressureSimulation
        ? pressureRef.current.getPressure(x, y)
        : 1;

    setCursor({
      visible: true,
      x: event.clientX - surfaceRect.left,
      y: event.clientY - surfaceRect.top,
      size: Math.max(8, store.size * 2 * Math.min(1, 1 / scaleX)),
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
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const brush = brushRef.current;
    const point = updateCursor(event);

    if (!brush || !point || !isDrawingRef.current) return;

    event.preventDefault();
    brush.putPoint(point.x, point.y, point.pressure);
    brush.render();
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    event.preventDefault();
    isDrawingRef.current = false;
    pressureRef.current.reset();
    brushRef.current?.finalizeStroke();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden bg-muted/30 p-6">
      <div
        ref={surfaceRef}
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/20 p-4"
      >
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full cursor-none rounded-md border bg-background shadow-sm"
          style={{
            aspectRatio: `${project.width} / ${project.height}`,
            width: project.width >= project.height ? "100%" : "auto",
            height: project.height > project.width ? "100%" : "auto",
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
