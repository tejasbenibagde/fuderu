import { useEffect, useRef, useState } from "react";
import type { Canvas, TransformHandleType } from "fuderu";
import {
  Check,
  FlipHorizontal2,
  FlipVertical2,
  Minus,
  Plus,
  RotateCw,
  X,
} from "lucide-react";
import type { StudioNotice } from "../hooks/useFuderuCanvas";
import type {
  StudioBrushState,
  StudioShapeOptions,
  StudioTool,
} from "../types/studio";
import type { SelectionMode } from "fuderu";

interface CanvasStageProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  engineRef: React.RefObject<Canvas | null>;
  docWidth: number;
  docHeight: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  activeTool: StudioTool;
  brushState: StudioBrushState;
  shapeOptions: StudioShapeOptions;
  selectionMode: SelectionMode;
  hasSelection: boolean;
  isTransforming: boolean;
  notice: StudioNotice | null;
  onDismissNotice: () => void;
  onPickColor: (hex: string) => void;
  onSelectTool: (tool: StudioTool) => void;
  onShowNotice: (type: StudioNotice["type"], message: string) => void;
  onSync: () => void;
}

interface TextPromptState {
  x: number;
  y: number;
  value: string;
}

export function CanvasStage({
  canvasRef,
  engineRef,
  docWidth,
  docHeight,
  zoom,
  onZoomChange,
  activeTool,
  brushState,
  shapeOptions,
  selectionMode,
  hasSelection,
  isTransforming,
  notice,
  onDismissNotice,
  onPickColor,
  onSelectTool,
  onShowNotice,
  onSync,
}: CanvasStageProps) {
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [textPrompt, setTextPrompt] = useState<TextPromptState | null>(null);
  const activeDragRef = useRef<boolean>(false);

  // Sync overlay canvas backing dimensions with document size
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.width = docWidth;
    overlay.height = docHeight;
  }, [docWidth, docHeight]);

  // Animate selection outline & transform box on overlay canvas when idle
  useEffect(() => {
    let rafId = 0;
    let dashOffset = 0;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const renderOverlay = () => {
      const overlay = overlayRef.current;
      const engine = engineRef.current;
      if (!overlay || !engine) return;
      const ctx = overlay.getContext("2d");
      if (!ctx) return;

      if (!activeDragRef.current) {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        if (engine.hasSelection()) {
          engine.renderSelectionOutline(ctx, {
            dashOffset,
            lineWidth: Math.max(1, 1.5 / zoom),
          });
        }
        if (engine.isTransforming()) {
          engine.renderTransformBox(ctx, {
            lineWidth: Math.max(1, 1.5 / zoom),
            handleSize: Math.max(6, 9 / zoom),
          });
        }
      }

      if ((hasSelection || isTransforming) && !prefersReducedMotion) {
        dashOffset = (dashOffset + 0.5) % 16;
        rafId = requestAnimationFrame(renderOverlay);
      }
    };

    renderOverlay();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [engineRef, hasSelection, isTransforming, zoom, docWidth, docHeight]);

  const toCanvasCoords = (clientX: number, clientY: number) => {
    const overlay = overlayRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    const scaleX = docWidth / (rect.width || 1);
    const scaleY = docHeight / (rect.height || 1);
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  };

  const handleOverlayPointerDown = (
    e: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const engine = engineRef.current;
    const overlay = overlayRef.current;
    if (!engine || !overlay) return;

    const start = toCanvasCoords(e.clientX, e.clientY);

    if (activeTool === "eyedropper") {
      const sample = engine.getColorAt(start.x, start.y, "composite");
      onPickColor(sample.hex);
      onShowNotice("info", `Sampled ${sample.hex.toUpperCase()}.`);
      return;
    }

    if (activeTool === "bucket") {
      try {
        engine.floodFill(start.x, start.y, brushState.color, 32);
        onSync();
      } catch (err) {
        onShowNotice(
          "error",
          err instanceof Error ? err.message : "Cannot fill active layer.",
        );
      }
      return;
    }

    if (activeTool === "text") {
      setTextPrompt({ x: start.x, y: start.y, value: "" });
      return;
    }

    if (activeTool === "transform") {
      const session = engine.getTransformSession();
      if (!session || !session.isActive()) return;
      const snap = session.getSnapshot();
      const handles = session.getHandles();
      const hitRadius = Math.max(12, 16 / zoom);

      let matchedHandle: TransformHandleType | null = null;
      for (const h of handles) {
        if (Math.hypot(start.x - h.x, start.y - h.y) <= hitRadius) {
          matchedHandle = h.type;
          break;
        }
      }

      activeDragRef.current = true;
      const startTranslation = { ...snap.translation };
      const startScale = { ...snap.scale };
      const startRotation = snap.rotation;
      const center = { ...snap.center };

      const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
      const startDist = Math.max(
        4,
        Math.hypot(start.x - center.x, start.y - center.y),
      );

      const onMove = (ev: PointerEvent) => {
        const cur = toCanvasCoords(ev.clientX, ev.clientY);
        setCursorCoords(cur);
        if (matchedHandle === "rotator") {
          const curAngle = Math.atan2(cur.y - center.y, cur.x - center.x);
          engine.transform({
            rotation: startRotation + (curAngle - startAngle),
          });
        } else if (matchedHandle && matchedHandle !== "pivot") {
          const curDist = Math.max(
            4,
            Math.hypot(cur.x - center.x, cur.y - center.y),
          );
          const ratio = curDist / startDist;
          if (matchedHandle === "left" || matchedHandle === "right") {
            engine.transform({
              scale: { x: startScale.x * ratio, y: startScale.y },
            });
          } else if (matchedHandle === "top" || matchedHandle === "bottom") {
            engine.transform({
              scale: { x: startScale.x, y: startScale.y * ratio },
            });
          } else {
            engine.transform({
              scale: { x: startScale.x * ratio, y: startScale.y * ratio },
            });
          }
        } else {
          engine.transform({
            translation: {
              x: startTranslation.x + (cur.x - start.x),
              y: startTranslation.y + (cur.y - start.y),
            },
          });
        }
        const ctx = overlay.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, overlay.width, overlay.height);
          engine.renderTransformBox(ctx, {
            lineWidth: Math.max(1, 1.5 / zoom),
            handleSize: Math.max(6, 9 / zoom),
          });
        }
      };

      const onUp = () => {
        activeDragRef.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        onSync();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return;
    }

    // Shapes or Selections (drag-based)
    activeDragRef.current = true;
    const lassoPoints: { x: number; y: number }[] = [start];

    const onMove = (ev: PointerEvent) => {
      const cur = toCanvasCoords(ev.clientX, ev.clientY);
      setCursorCoords(cur);
      const ctx = overlay.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      ctx.save();

      if (
        activeTool === "rectangle" ||
        activeTool === "ellipse" ||
        activeTool === "line"
      ) {
        ctx.strokeStyle = brushState.color;
        ctx.fillStyle = brushState.color;
        ctx.lineWidth = shapeOptions.strokeWidth;
        const rx = Math.min(start.x, cur.x);
        const ry = Math.min(start.y, cur.y);
        const rw = Math.abs(cur.x - start.x);
        const rh = Math.abs(cur.y - start.y);

        if (activeTool === "rectangle") {
          ctx.beginPath();
          if (
            shapeOptions.cornerRadius > 0 &&
            typeof ctx.roundRect === "function"
          ) {
            ctx.roundRect(rx, ry, rw, rh, shapeOptions.cornerRadius);
          } else {
            ctx.rect(rx, ry, rw, rh);
          }
          if (shapeOptions.fill) {
            ctx.globalAlpha = 0.45;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          if (shapeOptions.stroke) ctx.stroke();
        } else if (activeTool === "ellipse") {
          ctx.beginPath();
          ctx.ellipse(
            rx + rw / 2,
            ry + rh / 2,
            Math.max(1, rw / 2),
            Math.max(1, rh / 2),
            0,
            0,
            Math.PI * 2,
          );
          if (shapeOptions.fill) {
            ctx.globalAlpha = 0.45;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          if (shapeOptions.stroke) ctx.stroke();
        } else if (activeTool === "line") {
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
        }
      } else if (
        activeTool === "rectSelect" ||
        activeTool === "ellipseSelect"
      ) {
        const rx = Math.min(start.x, cur.x);
        const ry = Math.min(start.y, cur.y);
        const rw = Math.abs(cur.x - start.x);
        const rh = Math.abs(cur.y - start.y);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = Math.max(1, 1.5 / zoom);
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        if (activeTool === "rectSelect") {
          ctx.rect(rx, ry, rw, rh);
        } else {
          ctx.ellipse(
            rx + rw / 2,
            ry + rh / 2,
            Math.max(1, rw / 2),
            Math.max(1, rh / 2),
            0,
            0,
            Math.PI * 2,
          );
        }
        ctx.stroke();
      } else if (activeTool === "lassoSelect") {
        lassoPoints.push(cur);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = Math.max(1, 1.5 / zoom);
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
        for (let i = 1; i < lassoPoints.length; i++) {
          ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.restore();
    };

    const onUp = (ev: PointerEvent) => {
      activeDragRef.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      const end = toCanvasCoords(ev.clientX, ev.clientY);
      const rx = Math.min(start.x, end.x);
      const ry = Math.min(start.y, end.y);
      const rw = Math.abs(end.x - start.x);
      const rh = Math.abs(end.y - start.y);

      const ctx = overlay.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);

      try {
        if (activeTool === "rectangle" && rw > 1 && rh > 1) {
          engine.drawRectangle({
            x: rx,
            y: ry,
            width: rw,
            height: rh,
            fill: shapeOptions.fill,
            stroke: shapeOptions.stroke,
            fillColor: brushState.color,
            strokeColor: brushState.color,
            strokeWidth: shapeOptions.strokeWidth,
            cornerRadius: shapeOptions.cornerRadius,
          });
        } else if (activeTool === "ellipse" && rw > 1 && rh > 1) {
          engine.drawEllipse({
            x: rx + rw / 2,
            y: ry + rh / 2,
            radiusX: rw / 2,
            radiusY: rh / 2,
            fill: shapeOptions.fill,
            stroke: shapeOptions.stroke,
            fillColor: brushState.color,
            strokeColor: brushState.color,
            strokeWidth: shapeOptions.strokeWidth,
          });
        } else if (
          activeTool === "line" &&
          Math.hypot(end.x - start.x, end.y - start.y) > 1
        ) {
          engine.drawLine({
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            strokeColor: brushState.color,
            strokeWidth: shapeOptions.strokeWidth,
            lineCap: "round",
          });
        } else if (activeTool === "rectSelect" && rw > 2 && rh > 2) {
          engine.selectRectangle(rx, ry, rw, rh, selectionMode);
        } else if (activeTool === "ellipseSelect" && rw > 2 && rh > 2) {
          engine.selectEllipse(
            rx + rw / 2,
            ry + rh / 2,
            rw / 2,
            rh / 2,
            0,
            selectionMode,
          );
        } else if (activeTool === "lassoSelect" && lassoPoints.length >= 3) {
          engine.selectLasso(lassoPoints, selectionMode);
        }
      } catch (err) {
        onShowNotice(
          "error",
          err instanceof Error ? err.message : "Operation could not complete.",
        );
      }

      onSync();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const commitTextPrompt = () => {
    const engine = engineRef.current;
    if (!engine || !textPrompt) return;
    const text = textPrompt.value.trim();
    if (text) {
      try {
        engine.drawText(text, textPrompt.x, textPrompt.y, {
          color: brushState.color,
          fontSize: Math.max(16, brushState.size * 1.5),
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontWeight: 600,
        });
        onSync();
      } catch (err) {
        onShowNotice(
          "error",
          err instanceof Error ? err.message : "Cannot draw text on layer.",
        );
      }
    }
    setTextPrompt(null);
  };

  const displayW = Math.round(docWidth * zoom);
  const displayH = Math.round(docHeight * zoom);
  const isFreehand = activeTool === "brush" || activeTool === "eraser";

  return (
    <main className="relative flex-1 min-w-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* Optional contextual Transform action bar */}
      {isTransforming && (
        <div className="border-b border-slate-800 bg-slate-900/95 px-4 py-2 flex items-center justify-between gap-4 text-xs">
          <span className="font-medium text-slate-200">
            Active Transform Session — drag inside box to move, handles to
            scale/rotate
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                engineRef.current?.rotate(Math.PI / 12);
                onSync();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>+15°</span>
            </button>
            <button
              type="button"
              onClick={() => {
                engineRef.current?.flipHorizontal();
                onSync();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <FlipHorizontal2 className="h-3.5 w-3.5" />
              <span>Flip H</span>
            </button>
            <button
              type="button"
              onClick={() => {
                engineRef.current?.flipVertical();
                onSync();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <FlipVertical2 className="h-3.5 w-3.5" />
              <span>Flip V</span>
            </button>
            <button
              type="button"
              onClick={() => {
                engineRef.current?.cancelTransform();
                onSelectTool("brush");
                onSync();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={() => {
                engineRef.current?.commitTransform();
                onSelectTool("brush");
                onSync();
              }}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 font-medium text-white hover:bg-blue-500 whitespace-nowrap shrink-0"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      )}

      {/* Centered scrollable stage */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-8"
        onPointerMove={(e) => {
          if (overlayRef.current) {
            const coords = toCanvasCoords(e.clientX, e.clientY);
            if (
              coords.x >= 0 &&
              coords.y >= 0 &&
              coords.x <= docWidth &&
              coords.y <= docHeight
            ) {
              setCursorCoords(coords);
            }
          }
        }}
        onPointerLeave={() => setCursorCoords(null)}
      >
        <div
          className="relative studio-checkerboard shadow-2xl ring-1 ring-slate-700/80 shrink-0"
          style={{ width: displayW, height: displayH }}
        >
          <canvas
            ref={canvasRef}
            className="block touch-none"
            style={{
              width: displayW,
              height: displayH,
              cursor: isFreehand ? "crosshair" : "default",
            }}
          />
          <canvas
            ref={overlayRef}
            onPointerDown={handleOverlayPointerDown}
            className="absolute inset-0 touch-none"
            style={{
              width: displayW,
              height: displayH,
              pointerEvents: isFreehand ? "none" : "auto",
              cursor:
                activeTool === "eyedropper" ||
                activeTool === "bucket" ||
                activeTool === "text"
                  ? "crosshair"
                  : activeTool === "transform"
                    ? "move"
                    : "crosshair",
            }}
          />

          {/* Inline Text Input Popover */}
          {textPrompt && (
            <div
              className="absolute z-20 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl flex items-center gap-1.5"
              style={{
                left: Math.min(
                  displayW - 220,
                  Math.max(8, textPrompt.x * zoom),
                ),
                top: Math.min(displayH - 48, Math.max(8, textPrompt.y * zoom)),
              }}
            >
              <input
                type="text"
                autoFocus
                placeholder="Type text..."
                value={textPrompt.value}
                onChange={(e) =>
                  setTextPrompt((prev) =>
                    prev ? { ...prev, value: e.target.value } : null,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTextPrompt();
                  if (e.key === "Escape") setTextPrompt(null);
                }}
                className="w-36 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={commitTextPrompt}
                className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500"
              >
                Place
              </button>
              <button
                type="button"
                onClick={() => setTextPrompt(null)}
                className="rounded px-1.5 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notice toast (non-blocking) */}
      {notice && (
        <div
          role="status"
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-lg border px-3.5 py-2 text-xs font-medium flex items-center gap-3 shadow-lg ${
            notice.type === "error"
              ? "border-red-500/40 bg-slate-900 text-red-300"
              : "border-slate-700 bg-slate-900 text-slate-200"
          }`}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={onDismissNotice}
            aria-label="Dismiss message"
            className="text-slate-400 hover:text-slate-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Quiet bottom viewport zoom & coordinate bar */}
      <div className="h-9 shrink-0 border-t border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3 font-mono tabular-nums">
          <span>
            {cursorCoords
              ? `X ${cursorCoords.x} · Y ${cursorCoords.y}`
              : "Ready"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() =>
              onZoomChange(Math.max(0.2, Number((zoom - 0.1).toFixed(2))))
            }
            className="rounded p-1 hover:bg-slate-800 text-slate-300"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center font-mono tabular-nums text-slate-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() =>
              onZoomChange(Math.min(2.5, Number((zoom + 0.1).toFixed(2))))
            }
            className="rounded p-1 hover:bg-slate-800 text-slate-300"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onZoomChange(1)}
            className="ml-1 rounded px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800 whitespace-nowrap"
          >
            100%
          </button>
        </div>
      </div>
    </main>
  );
}
