"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

type BrushControlsProps = {
    size: number;
    radius: number;
    friction: number;
    opacity: number;
    color: string;
    eraser: boolean;

    onSizeChange: (value: number) => void;
    onRadiusChange: (value: number) => void;
    onFrictionChange: (value: number) => void;
    onOpacityChange: (value: number) => void;
    onColorChange: (value: string) => void;
    onEraserChange: (value: boolean) => void;

    onClear: () => void;
};

export function BrushControls({
    size,
    radius,
    friction,
    opacity,
    color,
    eraser,
    onSizeChange,
    onRadiusChange,
    onFrictionChange,
    onOpacityChange,
    onColorChange,
    onEraserChange,
    onClear,
}: BrushControlsProps) {
    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div>
                <h2 className="text-sm font-semibold">
                    Brush Controls
                </h2>

                <p className="text-xs text-muted-foreground">
                    Configure your brush engine.
                </p>
            </div>

            <Separator />

            {/* Brush Size */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Brush Size</Label>

                    <span className="text-xs text-muted-foreground">
                        {size}px
                    </span>
                </div>

                <Slider
                    value={[size]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(v) => onSizeChange(v[0])}
                />
            </div>

            {/* Radius */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Lazy Radius</Label>

                    <span className="text-xs text-muted-foreground">
                        {radius}px
                    </span>
                </div>

                <Slider
                    value={[radius]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => onRadiusChange(v[0])}
                />
            </div>

            {/* Friction */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Friction</Label>

                    <span className="text-xs text-muted-foreground">
                        {Math.round(friction * 100)}%
                    </span>
                </div>

                <Slider
                    value={[friction]}
                    min={0}
                    max={0.9}
                    step={0.01}
                    onValueChange={(v) => onFrictionChange(v[0])}
                />
            </div>

            {/* Opacity */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Opacity</Label>

                    <span className="text-xs text-muted-foreground">
                        {Math.round(opacity * 100)}%
                    </span>
                </div>

                <Slider
                    value={[opacity]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(v) => onOpacityChange(v[0])}
                />
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
                <Label>Brush Color</Label>

                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) =>
                            onColorChange(e.target.value)
                        }
                        className="h-10 w-16 cursor-pointer rounded-md border bg-transparent"
                    />

                    <div className="text-xs text-muted-foreground">
                        {color}
                    </div>
                </div>
            </div>

            {/* Eraser */}
            <div className="flex items-center justify-between">
                <div>
                    <Label>Eraser Mode</Label>

                    <p className="text-xs text-muted-foreground">
                        Toggle draw/erase
                    </p>
                </div>

                <Switch
                    checked={eraser}
                    onCheckedChange={onEraserChange}
                />
            </div>

            <Separator />

            {/* Clear */}
            <Button
                variant="destructive"
                className="w-full"
                onClick={onClear}
            >
                Clear Canvas
            </Button>
        </div>
    );
}