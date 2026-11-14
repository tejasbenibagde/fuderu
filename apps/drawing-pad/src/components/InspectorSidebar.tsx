import { useEffect, useRef, useState } from "react";
import type { BlendMode, Layer, SelectionMode } from "fuderu";
import {
  ArrowDown,
  ArrowUp,
  Clipboard,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  Lock,
  Plus,
  Scissors,
  Shield,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  BLEND_MODES,
  CANVAS_PRESETS,
  QUICK_SWATCHES,
  SELECTION_MODES,
  type JitterTrigger,
  type RotationMode,
  type StudioBrushState,
  type StudioShapeOptions,
  type StudioTool,
} from "../types/studio";

type InspectorTab = "brush" | "layers" | "document";

interface InspectorSidebarProps {
  activeTool: StudioTool;
  brushState: StudioBrushState;
  shapeOptions: StudioShapeOptions;
  selectionMode: SelectionMode;
  layers: readonly Layer[];
  activeLayerId: string;
  previewTick: number;
  hasSelection: boolean;
  hasClipboard: boolean;
  docWidth: number;
  docHeight: number;
  onUpdateBrush: (patch: Partial<StudioBrushState>) => void;
  onUpdateShapeOptions: (next: StudioShapeOptions) => void;
  onSelectionModeChange: (mode: SelectionMode) => void;
  onLoadBrushTip: (file: File) => void;
  onClearBrushTip: () => void;
  onCreateLayer: () => void;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (layer: Layer) => void;
  onToggleAlphaLock: (layer: Layer) => void;
  onToggleLock: (layer: Layer) => void;
  onSetLayerOpacity: (id: string, opacity: number) => void;
  onSetLayerBlendMode: (id: string, mode: BlendMode) => void;
  onRenameLayer: (id: string, name: string) => void;
  onMoveLayer: (id: string, delta: number) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onClearLayer: () => void;
  onSelectAll: () => void;
  onInvertSelection: () => void;
  onClearSelection: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onResizeDocument: (width: number, height: number) => void;
}

function LayerThumbnail({ layer, tick }: { layer: Layer; tick: number }) {
  const thumbRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    const scale = Math.min(
      el.width / layer.canvas.width,
      el.height / layer.canvas.height,
    );
    const w = layer.canvas.width * scale;
    const h = layer.canvas.height * scale;
    ctx.drawImage(layer.canvas, (el.width - w) / 2, (el.height - h) / 2, w, h);
  }, [layer, tick]);

  return (
    <canvas
      ref={thumbRef}
      width={40}
      height={28}
      className="h-7 w-10 rounded studio-checkerboard border border-slate-700 shrink-0"
    />
  );
}

export function InspectorSidebar({
  activeTool,
  brushState,
  shapeOptions,
  selectionMode,
  layers,
  activeLayerId,
  previewTick,
  hasSelection,
  hasClipboard,
  docWidth,
  docHeight,
  onUpdateBrush,
  onUpdateShapeOptions,
  onSelectionModeChange,
  onLoadBrushTip,
  onClearBrushTip,
  onCreateLayer,
  onSelectLayer,
  onToggleVisibility,
  onToggleAlphaLock,
  onToggleLock,
  onSetLayerOpacity,
  onSetLayerBlendMode,
  onRenameLayer,
  onMoveLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onClearLayer,
  onSelectAll,
  onInvertSelection,
  onClearSelection,
  onCopy,
  onCut,
  onPaste,
  onResizeDocument,
}: InspectorSidebarProps) {
  const [tab, setTab] = useState<InspectorTab>("brush");
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const brushTipInputRef = useRef<HTMLInputElement | null>(null);

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const orderedLayers = [...layers].reverse();

  return (
    <aside className="w-72 shrink-0 border-l border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
      {/* Segmented Inspector Tabs */}
      <div className="p-2 border-b border-slate-800">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-950 p-1">
          {(["brush", "layers", "document"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                tab === t
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {tab === "brush" && (
          <>
            {/* Color Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-300">
                  Color & Swatches
                </h2>
                <span className="font-mono text-xs uppercase text-slate-400 tabular-nums">
                  {brushState.color}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Brush color"
                  value={brushState.color}
                  onChange={(e) => onUpdateBrush({ color: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-700 bg-slate-950 p-0.5"
                />
                <input
                  type="text"
                  aria-label="Hex color value"
                  value={brushState.color}
                  onChange={(e) => onUpdateBrush({ color: e.target.value })}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {QUICK_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Color ${swatch}`}
                    onClick={() => onUpdateBrush({ color: swatch })}
                    className={`h-6 rounded border transition-transform hover:scale-105 ${
                      brushState.color.toLowerCase() === swatch
                        ? "border-blue-400 ring-1 ring-blue-400"
                        : "border-slate-700"
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </section>

            {/* Shape Tool Options when Shape is selected */}
            {(activeTool === "rectangle" ||
              activeTool === "ellipse" ||
              activeTool === "line") && (
              <section className="space-y-3 border-t border-slate-800 pt-4">
                <h2 className="text-xs font-semibold text-slate-300">
                  Shape Options
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  {activeTool !== "line" && (
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shapeOptions.fill}
                        onChange={(e) =>
                          onUpdateShapeOptions({
                            ...shapeOptions,
                            fill: e.target.checked,
                          })
                        }
                        className="accent-blue-500"
                      />
                      <span>Fill</span>
                    </label>
                  )}
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shapeOptions.stroke}
                      onChange={(e) =>
                        onUpdateShapeOptions({
                          ...shapeOptions,
                          stroke: e.target.checked,
                        })
                      }
                      className="accent-blue-500"
                    />
                    <span>Stroke</span>
                  </label>
                </div>
                <SliderRow
                  label="Stroke Width"
                  valueLabel={`${shapeOptions.strokeWidth} px`}
                  min={1}
                  max={48}
                  step={1}
                  value={shapeOptions.strokeWidth}
                  onChange={(v) =>
                    onUpdateShapeOptions({ ...shapeOptions, strokeWidth: v })
                  }
                />
                {activeTool === "rectangle" && (
                  <SliderRow
                    label="Corner Radius"
                    valueLabel={`${shapeOptions.cornerRadius} px`}
                    min={0}
                    max={64}
                    step={1}
                    value={shapeOptions.cornerRadius}
                    onChange={(v) =>
                      onUpdateShapeOptions({ ...shapeOptions, cornerRadius: v })
                    }
                  />
                )}
              </section>
            )}

            {/* Selection Combine Mode when Selection tool is active */}
            {(activeTool === "rectSelect" ||
              activeTool === "ellipseSelect" ||
              activeTool === "lassoSelect") && (
              <section className="space-y-2 border-t border-slate-800 pt-4">
                <h2 className="text-xs font-semibold text-slate-300">
                  Selection Mode
                </h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {SELECTION_MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => onSelectionModeChange(m.value)}
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        selectionMode === m.value
                          ? "border-blue-500 bg-blue-600/20 text-blue-300"
                          : "border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Core Brush Geometry */}
            <section className="space-y-3 border-t border-slate-800 pt-4">
              <h2 className="text-xs font-semibold text-slate-300">
                Brush Geometry
              </h2>
              <SliderRow
                label="Size"
                valueLabel={`${brushState.size} px`}
                min={1}
                max={180}
                step={1}
                value={brushState.size}
                onChange={(size) => onUpdateBrush({ size })}
              />
              <SliderRow
                label="Opacity"
                valueLabel={`${Math.round(brushState.opacity * 100)}%`}
                min={0.05}
                max={1}
                step={0.01}
                value={brushState.opacity}
                onChange={(opacity) => onUpdateBrush({ opacity })}
              />
              <SliderRow
                label="Flow"
                valueLabel={`${Math.round(brushState.flow * 100)}%`}
                min={0.05}
                max={1}
                step={0.01}
                value={brushState.flow}
                onChange={(flow) => onUpdateBrush({ flow })}
              />
              <SliderRow
                label="Spacing"
                valueLabel={`${brushState.spacing.toFixed(2)}`}
                min={0.04}
                max={2}
                step={0.02}
                value={brushState.spacing}
                onChange={(spacing) => onUpdateBrush({ spacing })}
              />
              <SliderRow
                label="Roundness"
                valueLabel={`${Math.round(brushState.roundness * 100)}%`}
                min={0.1}
                max={1}
                step={0.05}
                value={brushState.roundness}
                onChange={(roundness) => onUpdateBrush({ roundness })}
              />
              <SliderRow
                label="Angle"
                valueLabel={`${Math.round(brushState.angle * 180)}°`}
                min={0}
                max={1}
                step={0.02}
                value={brushState.angle}
                onChange={(angle) => onUpdateBrush({ angle })}
              />
            </section>

            {/* Stroke & Dynamics */}
            <section className="space-y-3 border-t border-slate-800 pt-4">
              <h2 className="text-xs font-semibold text-slate-300">
                Stroke & Dynamics
              </h2>

              <div className="space-y-2 text-xs text-slate-300">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Bezier Smoothing</span>
                  <input
                    type="checkbox"
                    checked={brushState.smooth}
                    onChange={(e) =>
                      onUpdateBrush({ smooth: e.target.checked })
                    }
                    className="accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Adaptive Spacing</span>
                  <input
                    type="checkbox"
                    checked={brushState.spacingEnabled}
                    onChange={(e) =>
                      onUpdateBrush({ spacingEnabled: e.target.checked })
                    }
                    className="accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Mouse Pressure Sim</span>
                  <input
                    type="checkbox"
                    checked={brushState.pressureSimulation}
                    onChange={(e) =>
                      onUpdateBrush({ pressureSimulation: e.target.checked })
                    }
                    className="accent-blue-500"
                  />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Rotation Mode</label>
                <select
                  value={brushState.rotationMode}
                  onChange={(e) =>
                    onUpdateBrush({
                      rotationMode: e.target.value as RotationMode,
                    })
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="fixed">Fixed Angle</option>
                  <option value="flow">Follow Stroke Direction</option>
                  <option value="random">Random Rotation</option>
                </select>
              </div>

              <SliderRow
                label="Size Jitter"
                valueLabel={`${Math.round(brushState.sizeJitter * 100)}%`}
                min={0}
                max={1}
                step={0.05}
                value={brushState.sizeJitter}
                onChange={(sizeJitter) => onUpdateBrush({ sizeJitter })}
              />
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Size Trigger</label>
                <select
                  value={brushState.sizeJitterTrigger}
                  onChange={(e) =>
                    onUpdateBrush({
                      sizeJitterTrigger: e.target.value as JitterTrigger,
                    })
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="none">Random Only</option>
                  <option value="pressure">Pressure + Random</option>
                </select>
              </div>

              <SliderRow
                label="Opacity Jitter"
                valueLabel={`${Math.round(brushState.opacityJitter * 100)}%`}
                min={0}
                max={1}
                step={0.05}
                value={brushState.opacityJitter}
                onChange={(opacityJitter) => onUpdateBrush({ opacityJitter })}
              />

              <SliderRow
                label="Scatter Spread"
                valueLabel={`${Math.round(brushState.spreadRange * 100)}%`}
                min={0}
                max={1}
                step={0.05}
                value={brushState.spreadRange}
                onChange={(spreadRange) => onUpdateBrush({ spreadRange })}
              />
              <SliderRow
                label="Scatter Count"
                valueLabel={`${brushState.spreadCount}`}
                min={1}
                max={8}
                step={1}
                value={brushState.spreadCount}
                onChange={(spreadCount) => onUpdateBrush({ spreadCount })}
              />
            </section>

            {/* Custom Image Brush Tip */}
            <section className="space-y-2 border-t border-slate-800 pt-4">
              <h2 className="text-xs font-semibold text-slate-300">
                Custom Brush Tip
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => brushTipInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {brushState.customTipName ?? "Upload PNG Tip"}
                  </span>
                </button>
                {brushState.customTipName && (
                  <button
                    type="button"
                    onClick={onClearBrushTip}
                    title="Clear custom tip"
                    className="rounded-md border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={brushTipInputRef}
                type="file"
                accept="image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onLoadBrushTip(file);
                  e.target.value = "";
                }}
              />
            </section>
          </>
        )}

        {tab === "layers" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300">
                Layers ({layers.length})
              </h2>
              <button
                type="button"
                onClick={onCreateLayer}
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>

            {activeLayer && (
              <div className="space-y-3 border-b border-slate-800 pb-4">
                <SliderRow
                  label="Layer Opacity"
                  valueLabel={`${Math.round(activeLayer.opacity * 100)}%`}
                  min={0}
                  max={1}
                  step={0.01}
                  value={activeLayer.opacity}
                  onChange={(opacity) =>
                    onSetLayerOpacity(activeLayer.id, opacity)
                  }
                />
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Blend Mode</label>
                  <select
                    value={activeLayer.blendMode}
                    onChange={(e) =>
                      onSetLayerBlendMode(
                        activeLayer.id,
                        e.target.value as BlendMode,
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                  >
                    {BLEND_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {orderedLayers.map((layer) => {
                const isActive = layer.id === activeLayerId;
                const isEditing = editingLayerId === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    className={`rounded-lg border p-2 cursor-pointer transition-colors space-y-2 ${
                      isActive
                        ? "border-blue-500/70 bg-slate-800/80"
                        : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayerThumbnail layer={layer} tick={previewTick} />
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => {
                              onRenameLayer(layer.id, editingName);
                              setEditingLayerId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                onRenameLayer(layer.id, editingName);
                                setEditingLayerId(null);
                              }
                              if (e.key === "Escape") setEditingLayerId(null);
                            }}
                            className="w-full rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-100 outline-none"
                          />
                        ) : (
                          <div
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingLayerId(layer.id);
                              setEditingName(layer.name);
                            }}
                            className="truncate text-xs font-medium text-slate-100"
                            title="Double-click to rename"
                          >
                            {layer.name}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                          {Math.round(layer.opacity * 100)}% · {layer.blendMode}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={layer.visible ? "Hide layer" : "Show layer"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(layer);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                      >
                        {layer.visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1 border-t border-slate-800/80 pt-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Alpha Lock"
                          aria-pressed={layer.alphaLock}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleAlphaLock(layer);
                          }}
                          className={`rounded px-1.5 py-1 text-[11px] inline-flex items-center gap-1 ${
                            layer.alphaLock
                              ? "bg-blue-600/20 text-blue-300"
                              : "text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          <span>Alpha</span>
                        </button>
                        <button
                          type="button"
                          title="Lock Layer"
                          aria-pressed={layer.locked}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock(layer);
                          }}
                          className={`rounded px-1.5 py-1 text-[11px] inline-flex items-center gap-1 ${
                            layer.locked
                              ? "bg-amber-600/20 text-amber-300"
                              : "text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          {layer.locked ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                          <span>Lock</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          title="Move Up"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveLayer(layer.id, 1);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          title="Move Down"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveLayer(layer.id, -1);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          title="Duplicate Layer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateLayer(layer.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          title="Delete Layer"
                          disabled={layers.length <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLayer(layer.id);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-red-400 disabled:opacity-30"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "document" && (
          <div className="space-y-5">
            <section className="space-y-2.5">
              <h2 className="text-xs font-semibold text-slate-300">
                Selection & Clipboard
              </h2>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={onInvertSelection}
                  disabled={!hasSelection}
                  className="rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                >
                  Invert
                </button>
                <button
                  type="button"
                  onClick={onClearSelection}
                  disabled={!hasSelection}
                  className="rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                >
                  Deselect
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={onCut}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                >
                  <Scissors className="h-3 w-3" />
                  <span>Cut</span>
                </button>
                <button
                  type="button"
                  onClick={onPaste}
                  disabled={!hasClipboard}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                >
                  <Clipboard className="h-3 w-3" />
                  <span>Paste</span>
                </button>
              </div>
            </section>

            <section className="space-y-2.5 border-t border-slate-800 pt-4">
              <h2 className="text-xs font-semibold text-slate-300">
                Canvas Presets
              </h2>
              <div className="space-y-1.5">
                {CANVAS_PRESETS.map((preset) => {
                  const active =
                    preset.width === docWidth && preset.height === docHeight;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        onResizeDocument(preset.width, preset.height)
                      }
                      className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors ${
                        active
                          ? "border-blue-500 bg-blue-600/15 text-blue-200"
                          : "border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {preset.width} × {preset.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2 border-t border-slate-800 pt-4">
              <h2 className="text-xs font-semibold text-slate-300">
                Active Layer Actions
              </h2>
              <button
                type="button"
                onClick={onClearLayer}
                className="w-full rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
              >
                Clear Active Layer
              </button>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}

function SliderRow({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-200 tabular-nums">
          {valueLabel}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full studio-range"
      />
    </div>
  );
}
