"use client";

import React, { useState } from "react";
import {
  IconEye,
  IconEyeOff,
  IconTrash,
  IconPlus,
  IconCopy,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LayerInfo } from "@/hooks/use-layer-manager";

const BLEND_MODES = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "soft-light", label: "Soft Light" },
  { value: "hard-light", label: "Hard Light" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
];

interface LayersPanelProps {
  layers: LayerInfo[];
  activeLayerId: string;
  onCreateLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onSetOpacity: (id: string, opacity: number) => void;
  onSelectLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onSetBlendMode?: (id: string, blendMode: string) => void;
}

export function LayersPanel({
  layers,
  activeLayerId,
  onCreateLayer,
  onDeleteLayer,
  onRenameLayer,
  onToggleVisibility,
  onSetOpacity,
  onSelectLayer,
  onDuplicateLayer,
  onSetBlendMode = () => {},
}: LayersPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleRenameStart = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleRenameEnd = (id: string) => {
    onRenameLayer(id, editingName.trim() || "Untitled");
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Layers ({layers.length})</div>
        <Button
          size="sm"
          variant="outline"
          onClick={onCreateLayer}
          className="h-7 gap-1"
        >
          <IconPlus className="size-3.5" />
          New
        </Button>
      </div>

      <Separator />

      {/* Layers List */}
      <div className="flex flex-col gap-1 overflow-y-auto max-h-96">
        {layers.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            No layers
          </div>
        ) : (
          layers.map((layer) => (
            <div
              key={layer.id}
              className={`group flex items-center gap-2 p-2 rounded-md border transition-colors ${
                layer.id === activeLayerId
                  ? "bg-primary/10 border-primary/50"
                  : "border-transparent hover:bg-muted/50"
              } cursor-pointer`}
              onClick={() => onSelectLayer(layer.id)}
            >
              {/* Layer Thumbnail */}
              <div className="w-8 h-10 rounded border bg-muted/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <canvas
                  width={32}
                  height={40}
                  ref={(canvas) => {
                    if (!canvas) return;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    ctx.clearRect(0, 0, 32, 40);
                    try {
                      const scaledCanvas = document.createElement("canvas");
                      scaledCanvas.width = 32;
                      scaledCanvas.height = 40;
                      const scaledCtx = scaledCanvas.getContext("2d");
                      if (scaledCtx) {
                        scaledCtx.drawImage(
                          layer.layer.canvas,
                          0,
                          0,
                          layer.layer.canvas.width,
                          layer.layer.canvas.height,
                          0,
                          0,
                          32,
                          40,
                        );
                        ctx.drawImage(scaledCanvas, 0, 0);
                      }
                    } catch {
                      // Canvas might not be ready yet
                    }
                  }}
                  className="w-full h-full"
                />
              </div>

              {/* Layer Info */}
              <div className="flex-1 min-w-0">
                {editingId === layer.id ? (
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameEnd(layer.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameEnd(layer.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-6 px-2 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    className="text-xs font-medium truncate cursor-text"
                    onDoubleClick={() =>
                      handleRenameStart(layer.id, layer.name)
                    }
                  >
                    {layer.name}
                  </div>
                )}
              </div>

              {/* Visibility Toggle */}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id, !layer.visible);
                }}
              >
                {layer.visible ? (
                  <IconEye className="size-3.5" />
                ) : (
                  <IconEyeOff className="size-3.5" />
                )}
              </Button>

              {/* Delete Button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLayer(layer.id);
                }}
              >
                <IconTrash className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Opacity & Blend Mode Controls */}
      {layers.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3 px-1">
            {/* Opacity Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {Math.round(
                    (layers.find((l) => l.id === activeLayerId)?.opacity ?? 1) *
                      100,
                  )}
                  %
                </span>
              </div>
              <Slider
                value={[
                  layers.find((l) => l.id === activeLayerId)?.opacity ?? 1,
                ]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => {
                  onSetOpacity(activeLayerId, value[0]);
                }}
              />
            </div>

            {/* Blend Mode Control */}
            <div className="space-y-2">
              <Label className="text-xs">Blend Mode</Label>
              <Select
                value={
                  layers.find((l) => l.id === activeLayerId)?.layer.blendMode ??
                  "source-over"
                }
                onValueChange={(value) => {
                  onSetBlendMode(activeLayerId, value);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLEND_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
