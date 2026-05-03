"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

type Props = {
  onBrushChange: (b: string) => void;
  onSizeChange: (s: number) => void;
  onOpacityChange: (o: number) => void;
  onClear: () => void;
  onToggleEraser: (v: boolean) => void;
};

export default function AppSidebar({
  onBrushChange,
  onSizeChange,
  onOpacityChange,
  onClear,
  onToggleEraser,
}: Props) {
  const [isEraser, setIsEraser] = useState(false);

  return (
    <aside className="w-64 border-r p-4 flex flex-col gap-6">

      {/* Brushes */}
      <div>
        <h2 className="text-sm font-medium mb-2">Brushes</h2>
        <div className="flex flex-col gap-2">
          <Button onClick={() => onBrushChange("dip-pen-soft")}>
            🖊️ Dip Pen
          </Button>
          <Button onClick={() => onBrushChange("airbrush-normal")}>
            💨 Airbrush
          </Button>
        </div>
      </div>
      <Button
        variant={isEraser ? "default" : "outline"}
        onClick={() => {
          setIsEraser(false);
          onToggleEraser(false);
        }}
      >
        ✏️ Draw
      </Button>

      <Button
        variant={isEraser ? "outline" : "default"}
        onClick={() => {
          setIsEraser(true);
          onToggleEraser(true);
        }}
      >
        🧽 Erase
      </Button>

      {/* Size */}
      <div>
        <h2 className="text-sm font-medium mb-2">Size</h2>
        <Slider
          defaultValue={[10]}
          max={50}
          step={1}
          onValueChange={(v) => onSizeChange(v[0])}
        />
      </div>

      {/* Opacity */}
      <div>
        <h2 className="text-sm font-medium mb-2">Opacity</h2>
        <Slider
          defaultValue={[1]}
          max={1}
          step={0.01}
          onValueChange={(v) => onOpacityChange(v[0])}
        />
      </div>

      {/* Actions */}
      <div className="mt-auto">
        <Button variant="destructive" onClick={onClear}>
          Clear Canvas
        </Button>
      </div>
    </aside>
  );
}