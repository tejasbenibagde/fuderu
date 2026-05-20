// components/layout/brush-controls.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { IconUpload, IconCopyX } from '@tabler/icons-react';
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
    FileUploadTrigger,
} from "@/components/ui/file-upload";
import React from "react";

type BrushControlsProps = {
    size: number;
    opacity: number;
    color: string;

    spacing: number;
    flow: number;
    roundness: number;
    image: string | null;


    smooth: boolean;

    onSizeChange: (v: number) => void;
    onOpacityChange: (v: number) => void;
    onColorChange: (v: string) => void;

    onSpacingChange: (v: number) => void;
    onFlowChange: (v: number) => void;
    onRoundnessChange: (v: number) => void;
    onImageChange: (
        image: string | null
    ) => void;
    onSmoothChange: (
        v: boolean
    ) => void;

    onClear: () => void;
    onUndo: () => void;
    onRedo: () => void;
};

export function BrushControls({
    size,
    opacity,
    color,

    spacing,
    flow,
    roundness,

    smooth,
    image,

    onSizeChange,
    onOpacityChange,
    onColorChange,

    onSpacingChange,
    onFlowChange,
    onRoundnessChange,

    onImageChange,

    onSmoothChange,

    onClear,
    onUndo,
    onRedo,
}: BrushControlsProps) {

    const [files, setFiles] =
        React.useState<File[]>([]);
    return (
        <div className="space-y-6 p-4">
            <div>
                <h2 className="text-sm font-semibold">
                    Brush Controls
                </h2>

                <p className="text-xs text-muted-foreground">
                    Configure Fuderu brush engine.
                </p>
            </div>

            <Separator />

            {/* Size */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <Label>Size</Label>

                    <span className="text-xs text-muted-foreground">
                        {size}px
                    </span>
                </div>

                <Slider
                    value={[size]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(v) =>
                        onSizeChange(v[0])
                    }
                />
            </div>

            {/* Opacity */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <Label>Opacity</Label>

                    <span className="text-xs text-muted-foreground">
                        {Math.round(
                            opacity * 100
                        )}
                        %
                    </span>
                </div>

                <Slider
                    value={[opacity]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(v) =>
                        onOpacityChange(v[0])
                    }
                />
            </div>

            {/* Flow */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <Label>Flow</Label>

                    <span className="text-xs text-muted-foreground">
                        {Math.round(flow * 100)}%
                    </span>
                </div>

                <Slider
                    value={[flow]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(v) =>
                        onFlowChange(v[0])
                    }
                />
            </div>

            {/* Spacing */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <Label>Spacing</Label>

                    <span className="text-xs text-muted-foreground">
                        {spacing.toFixed(2)}
                    </span>
                </div>

                <Slider
                    value={[spacing]}
                    min={0.01}
                    max={5}
                    step={0.01}
                    onValueChange={(v) =>
                        onSpacingChange(v[0])
                    }
                />
            </div>

            {/* Roundness */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <Label>Roundness</Label>

                    <span className="text-xs text-muted-foreground">
                        {roundness.toFixed(2)}
                    </span>
                </div>

                <Slider
                    value={[roundness]}
                    min={0.1}
                    max={1}
                    step={0.01}
                    onValueChange={(v) =>
                        onRoundnessChange(v[0])
                    }
                />
            </div>

            {/* Color */}
            <div className="space-y-3">
                <Label>Brush Color</Label>

                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) =>
                            onColorChange(
                                e.target.value
                            )
                        }
                        className="h-10 w-16 cursor-pointer rounded-md border"
                    />

                    <span className="text-xs text-muted-foreground">
                        {color}
                    </span>
                </div>
            </div>

            {/* Smooth */}
            <div className="flex items-center justify-between">
                <div>
                    <Label>
                        Smooth Stroke
                    </Label>

                    <p className="text-xs text-muted-foreground">
                        Enable bezier smoothing
                    </p>
                </div>

                <Switch
                    checked={smooth}
                    onCheckedChange={
                        onSmoothChange
                    }
                />
            </div>

            {/* Image Brush */}
            {/* Image Brush */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Brush Image</Label>

                    {image && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                onImageChange(null);
                                setFiles([]);
                            }}
                        >
                            Remove
                        </Button>
                    )}
                </div>

                <FileUpload
                    value={files}
                    onValueChange={(newFiles) => {
                        setFiles(newFiles);

                        const file = newFiles[0];

                        if (!file) {
                            onImageChange(null);
                            return;
                        }

                        const reader =
                            new FileReader();

                        reader.onload = () => {
                            onImageChange(
                                reader.result as string
                            );
                        };

                        reader.readAsDataURL(file);
                    }}
                    accept="image/*"
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024}
                    className="w-full"
                >
                    <FileUploadDropzone className="py-6">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <IconUpload className="size-5 text-muted-foreground" />

                            <div className="text-sm">
                                Drop brush image or{" "}
                                <FileUploadTrigger asChild>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0"
                                    >
                                        browse
                                    </Button>
                                </FileUploadTrigger>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                PNG with transparency recommended
                            </p>
                        </div>
                    </FileUploadDropzone>

                    <FileUploadList className="mt-2">
                        {files.map((file, index) => (
                            <FileUploadItem
                                key={index}
                                value={file}
                                className="p-2"
                            >
                                <FileUploadItemPreview className="size-10 rounded-md" />

                                <FileUploadItemMetadata
                                    size="sm"
                                />

                                <FileUploadItemDelete
                                    asChild
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                    >
                                        <IconCopyX className="size-4" />
                                    </Button>
                                </FileUploadItemDelete>
                            </FileUploadItem>
                        ))}
                    </FileUploadList>
                </FileUpload>

                {image && (
                    <div className="overflow-hidden rounded-xl border bg-muted/20">
                        <img
                            src={image}
                            alt="Brush Preview"
                            className="h-32 w-full object-contain p-4"
                        />
                    </div>
                )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    onClick={onUndo}
                >
                    Undo
                </Button>

                <Button
                    variant="outline"
                    onClick={onRedo}
                >
                    Redo
                </Button>
            </div>

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