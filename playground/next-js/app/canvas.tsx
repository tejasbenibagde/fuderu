"use client";

import { useEffect, useRef } from "react";

import {
  Canvas as FuderuCanvas,
  DynamicShapeModule,
  DynamicTransparencyModule,
  PatternModule,
  SpreadModule,
} from "fuderu";

import { useBrushStore } from "@/components/playground/brush-store";

type ModuleRefs = {
  dynamicShape: DynamicShapeModule;
  dynamicTransparency: DynamicTransparencyModule;
  spread: SpreadModule;
  pattern: PatternModule;
};

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FuderuCanvas | null>(null);
  const modulesRef = useRef<ModuleRefs | null>(null);

  const store = useBrushStore();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initialState = useBrushStore.getState();

    const dynamicShape = new DynamicShapeModule();
    const dynamicTransparency = new DynamicTransparencyModule();
    const spread = new SpreadModule({ spreadRange: 0 });
    const pattern = new PatternModule();

    const engine = new FuderuCanvas({
      canvas: canvasRef.current,
      pressureSimulation: initialState.pressureSimulation,
      brush: {
        size: initialState.size,
        opacity: initialState.opacity,
        color: initialState.color,
        spacing: initialState.spacing,
        flow: initialState.flow,
        roundness: initialState.roundness,
        angle: initialState.angle,
        rotation: {
          mode: initialState.rotationMode,
          offset: initialState.rotationOffset * Math.PI,
          jitter: initialState.rotationJitter * Math.PI,
          smoothing: initialState.rotationSmoothing,
        },
      },
    });

    engine.brush.useModule(dynamicShape);
    engine.brush.useModule(dynamicTransparency);
    engine.brush.useModule(spread);
    engine.brush.useModule(pattern);

    engine.brush.isSmooth = initialState.smooth;
    engine.brush.isSpacing = initialState.spacingEnabled;
    engine.pressureSimulation = initialState.pressureSimulation;

    engineRef.current = engine;
    modulesRef.current = {
      dynamicShape,
      dynamicTransparency,
      spread,
      pattern,
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
      modulesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;

    if (!engine) return;

    engine.brush.loadConfig({
      size: store.size,
      opacity: store.opacity,
      color: store.color,
      spacing: store.spacing,
      flow: store.flow,
      roundness: store.roundness,
      angle: store.angle,
      rotation: {
        mode: store.rotationMode,
        offset: store.rotationOffset * Math.PI,
        jitter: store.rotationJitter * Math.PI,
        smoothing: store.rotationSmoothing,
      },
    });

    engine.brush.isSmooth = store.smooth;
    engine.brush.isSpacing = store.spacingEnabled;
    engine.pressureSimulation = store.pressureSimulation;
  }, [
    store.size,
    store.opacity,
    store.color,
    store.spacing,
    store.flow,
    store.roundness,
    store.angle,
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
    const engine = engineRef.current;

    if (!engine) return;

    if (!store.image) {
      engine.brush.removeImage();
      return;
    }

    engine.loadImage(store.image);
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
    engineRef.current?.clear();
  }, [store.clearTrigger]);

  useEffect(() => {
    if (store.undoTrigger === 0) return;

    engineRef.current?.undo();
  }, [store.undoTrigger]);

  useEffect(() => {
    if (store.redoTrigger === 0) return;

    engineRef.current?.redo();
  }, [store.redoTrigger]);

  return (
    <div className="flex-1 bg-muted/30 p-6">
      <canvas
        ref={canvasRef}
        className="h-full w-full rounded-2xl border border-dashed bg-background"
      />
    </div>
  );
};

export default Canvas;
