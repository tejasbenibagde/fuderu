import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Canvas as FuderuCanvas,
  DynamicShapeModule,
  DynamicTransparencyModule,
  PatternModule,
  SpreadModule,
} from "fuderu";

import styles from "./FuderuDemo.module.css";

const IMAGE_SOURCES = [
  {
    label: "Star stamp",
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath fill='none' stroke='%23000000' stroke-width='6' d='M32 4l8 20 20 2-15 13 5 20-17-11-17 11 5-20-15-13 20-2z'/%3E%3C/svg%3E",
  },
  {
    label: "Leaf stamp",
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath fill='none' stroke='%23000000' stroke-width='6' d='M8 32c16-24 32-24 48 0-16 24-32 24-48 0zm20-8l12 12m0-12l-12 12'/%3E%3C/svg%3E",
  },
];

const PATTERN_SOURCE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%23f8fafc'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%230f766e'/%3E%3C/svg%3E";

interface FuderuDemoProps {
  title?: string;
  description?: string;
  brushColor?: string;
  brushSize?: number;
  spacing?: number;
  compact?: boolean;
  mode?: "intro" | "brush" | "image" | "modules";
}

export default function FuderuDemo({
  title,
  description,
  brushColor = "#0f766e",
  brushSize = 18,
  spacing = 0.18,
  compact = false,
  mode = "intro",
}: FuderuDemoProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const demoRef = useRef<FuderuCanvas | null>(null);
  const dynamicShapeRef = useRef<DynamicShapeModule | null>(null);
  const dynamicShapeIdRef = useRef<string | null>(null);
  const transparencyRef = useRef<DynamicTransparencyModule | null>(null);
  const transparencyIdRef = useRef<string | null>(null);
  const spreadRef = useRef<SpreadModule | null>(null);
  const spreadIdRef = useRef<string | null>(null);
  const patternRef = useRef<PatternModule | null>(null);
  const patternIdRef = useRef<string | null>(null);

  const [isEraser, setIsEraser] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [color, setColor] = useState(brushColor);
  const [size, setSize] = useState(brushSize);
  const [spacingValue, setSpacingValue] = useState(spacing);
  const [isSmooth, setIsSmooth] = useState(true);
  const [isSpacingEnabled, setIsSpacingEnabled] = useState(true);
  const [blendMode, setBlendMode] =
    useState<CanvasRenderingContext2D["globalCompositeOperation"]>(
      "source-over",
    );
  const [filter, setFilter] =
    useState<CanvasRenderingContext2D["filter"]>("none");
  const [rotationMode, setRotationMode] = useState<"fixed" | "flow" | "random">(
    "flow",
  );
  const [imageStatus, setImageStatus] = useState("No image loaded");
  const [isPatternLoading, setIsPatternLoading] = useState(false);
  const [dynamicShapeEnabled, setDynamicShapeEnabled] = useState(false);
  const [transparencyEnabled, setTransparencyEnabled] = useState(false);
  const [spreadEnabled, setSpreadEnabled] = useState(false);
  const [patternEnabled, setPatternEnabled] = useState(false);
  const [isPressureEnabled, setIsPressureEnabled] = useState(true);

  const initialBrush = useMemo(
    () => ({
      color: brushColor,
      size: brushSize,
      spacing,
      roundness: 0.8,
      opacity: 0.95,
      flow: 0.9,
    }),
    [brushColor, brushSize, spacing],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const documentSize = {
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height)),
    };

    const canvas = new FuderuCanvas({
      canvas: canvasRef.current,
      document: documentSize,
      pressureSimulation: isPressureEnabled,
      brush: initialBrush,
    });

    demoRef.current = canvas;
    setIsReady(true);

    return () => {
      canvas.destroy();
      demoRef.current = null;
      setIsReady(false);
    };
  }, [initialBrush]);

  useEffect(() => {
    const canvas = demoRef.current;
    if (!canvas) return;

    canvas.pressureSimulation = isPressureEnabled;
  }, [isPressureEnabled]);

  useEffect(() => {
    const canvas = demoRef.current;
    if (!canvas) return;

    canvas.loadConfig({
      color,
      size,
      spacing: isSpacingEnabled ? spacingValue : 1,
      roundness: 0.8,
      opacity: 0.95,
      flow: 0.9,
      rotation:
        mode === "image" ? { mode: rotationMode, smoothing: 0.15 } : undefined,
    });

    canvas.setSmooth(isSmooth);
    canvas.setSpacing(isSpacingEnabled);
    canvas.brush.blendMode = blendMode;
    canvas.brush.filter = filter;
    canvas.setEraser(isEraser);
  }, [
    color,
    size,
    spacingValue,
    isSmooth,
    isSpacingEnabled,
    blendMode,
    filter,
    rotationMode,
    isEraser,
    mode,
  ]);

  const handleClear = (): void => {
    demoRef.current?.clear();
  };

  const handleUndo = (): void => {
    demoRef.current?.undo();
  };

  const handleRedo = (): void => {
    demoRef.current?.redo();
  };

  const handleEraserToggle = (): void => {
    const next = !isEraser;
    setIsEraser(next);
    demoRef.current?.setEraser(next);
  };

  const handleLoadImage = async (url: string): Promise<void> => {
    if (!demoRef.current) return;

    setImageStatus("Loading image...");
    try {
      await demoRef.current.loadImage(url);
      setImageStatus("Image loaded");
    } catch {
      setImageStatus("Failed to load image");
    }
  };

  const handleRemoveImage = (): void => {
    demoRef.current?.brush.removeImage();
    setImageStatus("Image removed");
  };

  const toggleModule = async (
    enabled: boolean,
    factory: () =>
      | DynamicShapeModule
      | DynamicTransparencyModule
      | SpreadModule
      | PatternModule,
    ref: React.MutableRefObject<
      | DynamicShapeModule
      | DynamicTransparencyModule
      | SpreadModule
      | PatternModule
      | null
    >,
    idRef: React.MutableRefObject<string | null>,
    loadPattern?: boolean,
  ) => {
    if (!demoRef.current) return;

    if (enabled) {
      const module = factory();
      if (loadPattern && module instanceof PatternModule && canvasRef.current) {
        setIsPatternLoading(true);
        await module.loadPattern(
          PATTERN_SOURCE,
          canvasRef.current.width,
          canvasRef.current.height,
          color,
        );
        setIsPatternLoading(false);
      }
      const id = demoRef.current.brush.useModule(module);
      ref.current = module;
      idRef.current = id;
      return;
    }

    if (idRef.current) {
      demoRef.current.brush.removeModule(idRef.current);
      ref.current = null;
      idRef.current = null;
    }
  };

  const isModuleMode = mode === "modules";
  const isImageMode = mode === "image";

  return (
    <div className={compact ? styles.cardCompact : styles.card}>
      {(title || description) && (
        <div className={styles.header}>
          {title && <div className={styles.title}>{title}</div>}
          {description && <p className={styles.description}>{description}</p>}
        </div>
      )}
      <div className={styles.canvasWrapper}>
        <canvas ref={canvasRef} className={styles.canvas} />
        {!isReady && <div className={styles.loading}>Loading demo…</div>}
      </div>
      {!compact && (
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <button
              className={styles.button}
              onClick={handleClear}
              type="button"
            >
              Clear
            </button>
            <button
              className={styles.button}
              onClick={handleUndo}
              type="button"
            >
              Undo
            </button>
            <button
              className={styles.button}
              onClick={handleRedo}
              type="button"
            >
              Redo
            </button>
            <button
              className={styles.button}
              onClick={handleEraserToggle}
              type="button"
            >
              {isEraser ? "Brush" : "Eraser"}
            </button>
          </div>
          <div className={styles.controlRow}>
            <label className={styles.controlLabel}>
              Color
              <input
                className={styles.colorInput}
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
            <label className={styles.controlLabel}>
              Size
              <input
                className={styles.rangeInput}
                type="range"
                min="4"
                max="80"
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
              />
            </label>
            <label className={styles.controlLabel}>
              Spacing
              <input
                className={styles.rangeInput}
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={spacingValue}
                onChange={(event) =>
                  setSpacingValue(Number(event.target.value))
                }
              />
            </label>
          </div>
          {isImageMode && (
            <div className={styles.controlRow}>
              {IMAGE_SOURCES.map((source) => (
                <button
                  key={source.label}
                  className={styles.button}
                  onClick={() => void handleLoadImage(source.url)}
                  type="button"
                >
                  {source.label}
                </button>
              ))}
              <button
                className={styles.button}
                onClick={handleRemoveImage}
                type="button"
              >
                Remove image
              </button>
              <span className={styles.status}>{imageStatus}</span>
            </div>
          )}
          {isImageMode && (
            <div className={styles.controlRow}>
              <label className={styles.controlLabel}>
                Rotation
                <select
                  className={styles.selectInput}
                  value={rotationMode}
                  onChange={(event) =>
                    setRotationMode(
                      event.target.value as "fixed" | "flow" | "random",
                    )
                  }
                >
                  <option value="fixed">fixed</option>
                  <option value="flow">flow</option>
                  <option value="random">random</option>
                </select>
              </label>
            </div>
          )}
          {mode === "brush" && (
            <div className={styles.controlRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isSmooth}
                  onChange={(event) => setIsSmooth(event.target.checked)}
                />
                Smooth
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isSpacingEnabled}
                  onChange={(event) =>
                    setIsSpacingEnabled(event.target.checked)
                  }
                />
                Spacing
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isPressureEnabled}
                  onChange={(event) =>
                    setIsPressureEnabled(event.target.checked)
                  }
                />
                Pressure sensitivity
              </label>
              <label className={styles.controlLabel}>
                Blend mode
                <select
                  className={styles.selectInput}
                  value={blendMode}
                  onChange={(event) =>
                    setBlendMode(
                      event.target
                        .value as CanvasRenderingContext2D["globalCompositeOperation"],
                    )
                  }
                >
                  <option value="source-over">source-over</option>
                  <option value="multiply">multiply</option>
                  <option value="screen">screen</option>
                  <option value="overlay">overlay</option>
                </select>
              </label>
              <label className={styles.controlLabel}>
                Filter
                <select
                  className={styles.selectInput}
                  value={filter}
                  onChange={(event) =>
                    setFilter(
                      event.target.value as CanvasRenderingContext2D["filter"],
                    )
                  }
                >
                  <option value="none">none</option>
                  <option value="blur(1px)">blur</option>
                  <option value="brightness(1.25)">bright</option>
                  <option value="contrast(1.2)">contrast</option>
                </select>
              </label>
            </div>
          )}
          {isModuleMode && (
            <div className={styles.controlRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={dynamicShapeEnabled}
                  onChange={async (event) => {
                    const enabled = event.target.checked;
                    setDynamicShapeEnabled(enabled);
                    await toggleModule(
                      enabled,
                      () =>
                        new DynamicShapeModule({
                          sizeJitter: 0.35,
                          minDiameter: 0.5,
                          angleJitter: 0.3,
                          roundJitter: 0.25,
                          minRoundness: 0.4,
                        }),
                      dynamicShapeRef,
                      dynamicShapeIdRef,
                    );
                  }}
                />
                Dynamic shape
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={transparencyEnabled}
                  onChange={async (event) => {
                    const enabled = event.target.checked;
                    setTransparencyEnabled(enabled);
                    await toggleModule(
                      enabled,
                      () =>
                        new DynamicTransparencyModule({
                          opacityJitter: 0.25,
                          minOpacityJitter: 0.4,
                          flowJitter: 0.25,
                          minFlowJitter: 0.35,
                        }),
                      transparencyRef,
                      transparencyIdRef,
                    );
                  }}
                />
                Dynamic transparency
              </label>
            </div>
          )}
          {isModuleMode && (
            <div className={styles.controlRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={spreadEnabled}
                  onChange={async (event) => {
                    const enabled = event.target.checked;
                    setSpreadEnabled(enabled);
                    await toggleModule(
                      enabled,
                      () =>
                        new SpreadModule({
                          spreadRange: 0.25,
                          count: 5,
                          countJitter: 0.4,
                        }),
                      spreadRef,
                      spreadIdRef,
                    );
                  }}
                />
                Spread
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={patternEnabled}
                  onChange={async (event) => {
                    const enabled = event.target.checked;
                    setPatternEnabled(enabled);
                    await toggleModule(
                      enabled,
                      () =>
                        new PatternModule({
                          scale: 0.8,
                          brightness: 10,
                          contrast: 10,
                          blendMode: "multiply",
                        }),
                      patternRef,
                      patternIdRef,
                      true,
                    );
                  }}
                />
                Pattern
              </label>
              {isPatternLoading && (
                <span className={styles.status}>Loading pattern…</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
