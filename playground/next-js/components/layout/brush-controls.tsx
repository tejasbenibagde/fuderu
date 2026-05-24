// components/layout/brush-controls.tsx

"use client";

import React from "react";
import Image from "next/image";
import {
  IconChevronRight,
  IconCopyX,
  IconPhoto,
  IconUpload,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  PressureTrigger,
  RotationMode,
  useBrushStore,
} from "../playground/brush-store";

type SectionId =
  | "core"
  | "stroke"
  | "rotation"
  | "image"
  | "shape"
  | "transparency"
  | "spread"
  | "pattern"
  | "actions";

function ControlSection({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id: SectionId;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-expanded={open}
        aria-controls={`brush-section-${id}`}
        onClick={() => setOpen((value) => !value)}
      >
        <IconChevronRight
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="truncate">{title}</span>
      </button>

      {open && (
        <div id={`brush-section-${id}`} className="space-y-4 px-3 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

function SliderField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {display ?? value.toFixed(2)}
        </span>
      </div>

      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(next[0])}
      />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-md border bg-muted/30 p-1">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          variant={value === option ? "default" : "ghost"}
          size="sm"
          className="h-7 capitalize"
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

function ImageControl({
  label,
  image,
  onImageChange,
}: {
  label: string;
  image: string | null;
  onImageChange: (image: string | null) => void;
}) {
  const [files, setFiles] = React.useState<File[]>([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>

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

          const reader = new FileReader();

          reader.onload = () => {
            onImageChange(reader.result as string);
          };

          reader.readAsDataURL(file);
        }}
        accept="image/*"
        maxFiles={1}
        maxSize={5 * 1024 * 1024}
        className="w-full"
      >
        <FileUploadDropzone className="py-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <IconUpload className="size-5 text-muted-foreground" />

            <div className="text-sm">
              Drop image or{" "}
              <FileUploadTrigger asChild>
                <Button variant="link" size="sm" className="h-auto p-0">
                  browse
                </Button>
              </FileUploadTrigger>
            </div>
          </div>
        </FileUploadDropzone>

        <FileUploadList className="mt-2">
          {files.map((file, index) => (
            <FileUploadItem key={index} value={file} className="p-2">
              <FileUploadItemPreview className="size-10 rounded-md" />

              <FileUploadItemMetadata size="sm" />

              <FileUploadItemDelete asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <IconCopyX className="size-4" />
                </Button>
              </FileUploadItemDelete>
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>

      {image && (
        <div className="overflow-hidden rounded-md border bg-muted/20">
          <Image
            src={image}
            alt={`${label} preview`}
            width={240}
            height={112}
            unoptimized
            className="h-28 w-full object-contain p-3"
          />
        </div>
      )}
    </div>
  );
}

export function BrushControls() {
  const store = useBrushStore();

  return (
    <div className="pb-2">
      <ControlSection id="core" title="Core Brush" defaultOpen>
        <SliderField
          label="Size"
          value={store.size}
          display={`${store.size}px`}
          min={1}
          max={120}
          step={1}
          onChange={store.setSize}
        />

        <SliderField
          label="Opacity"
          value={store.opacity}
          display={`${Math.round(store.opacity * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setOpacity}
        />

        <SliderField
          label="Flow"
          value={store.flow}
          display={`${Math.round(store.flow * 100)}%`}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setFlow}
        />

        <SliderField
          label="Roundness"
          value={store.roundness}
          min={0.05}
          max={1}
          step={0.01}
          onChange={store.setRoundness}
        />

        <SliderField
          label="Angle"
          value={store.angle}
          display={`${Math.round(store.angle * 360)}deg`}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setAngle}
        />

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="grid grid-cols-[3rem_1fr] gap-2">
            <Input
              type="color"
              value={store.color}
              onChange={(event) => store.setColor(event.target.value)}
              className="cursor-pointer p-1"
            />
            <Input
              value={store.color}
              onChange={(event) => store.setColor(event.target.value)}
            />
          </div>
        </div>
      </ControlSection>

      <ControlSection id="stroke" title="Stroke Input" defaultOpen>
        <ToggleField
          label="Smooth"
          checked={store.smooth}
          onChange={store.setSmooth}
        />

        <ToggleField
          label="Spacing"
          checked={store.spacingEnabled}
          onChange={store.setSpacingEnabled}
        />

        <ToggleField
          label="Mouse pressure"
          checked={store.pressureSimulation}
          onChange={store.setPressureSimulation}
        />

        <SliderField
          label="Spacing amount"
          value={store.spacing}
          min={0.01}
          max={5}
          step={0.01}
          onChange={store.setSpacing}
        />
      </ControlSection>

      <ControlSection id="rotation" title="Rotation">
        <SegmentedControl<RotationMode>
          value={store.rotationMode}
          options={["fixed", "flow", "random"]}
          onChange={store.setRotationMode}
        />

        <SliderField
          label="Offset"
          value={store.rotationOffset}
          display={`${Math.round(store.rotationOffset * 180)}deg`}
          min={-1}
          max={1}
          step={0.01}
          onChange={store.setRotationOffset}
        />

        <SliderField
          label="Jitter"
          value={store.rotationJitter}
          display={`${Math.round(store.rotationJitter * 180)}deg`}
          min={0}
          max={2}
          step={0.01}
          onChange={store.setRotationJitter}
        />

        <SliderField
          label="Smoothing"
          value={store.rotationSmoothing}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setRotationSmoothing}
        />
      </ControlSection>

      <ControlSection id="image" title="Image Brush">
        <ImageControl
          label="Brush Image"
          image={store.image}
          onImageChange={store.setImage}
        />
      </ControlSection>

      <ControlSection id="shape" title="Dynamic Shape">
        <ToggleField
          label="Enabled"
          checked={store.dynamicShapeEnabled}
          onChange={store.setDynamicShapeEnabled}
        />

        <SliderField
          label="Size jitter"
          value={store.sizeJitter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setSizeJitter}
        />

        <SegmentedControl<PressureTrigger>
          value={store.sizeJitterTrigger}
          options={["none", "pressure"]}
          onChange={store.setSizeJitterTrigger}
        />

        <SliderField
          label="Min diameter"
          value={store.minDiameter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setMinDiameter}
        />

        <Separator />

        <SliderField
          label="Angle jitter"
          value={store.angleJitter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setAngleJitter}
        />

        <SegmentedControl<PressureTrigger>
          value={store.angleJitterTrigger}
          options={["none", "pressure"]}
          onChange={store.setAngleJitterTrigger}
        />

        <Separator />

        <SliderField
          label="Round jitter"
          value={store.roundJitter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setRoundJitter}
        />

        <SegmentedControl<PressureTrigger>
          value={store.roundJitterTrigger}
          options={["none", "pressure"]}
          onChange={store.setRoundJitterTrigger}
        />

        <SliderField
          label="Min roundness"
          value={store.minRoundness}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setMinRoundness}
        />
      </ControlSection>

      <ControlSection id="transparency" title="Dynamic Transparency">
        <ToggleField
          label="Enabled"
          checked={store.dynamicTransparencyEnabled}
          onChange={store.setDynamicTransparencyEnabled}
        />

        <SliderField
          label="Opacity jitter"
          value={store.opacityJitter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setOpacityJitter}
        />

        <SegmentedControl<PressureTrigger>
          value={store.opacityJitterTrigger}
          options={["none", "pressure"]}
          onChange={store.setOpacityJitterTrigger}
        />

        <SliderField
          label="Min opacity"
          value={store.minOpacityJitter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setMinOpacityJitter}
        />

        <Separator />

        <SliderField
          label="Flow jitter"
          value={store.flowJitter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setFlowJitter}
        />

        <SegmentedControl<PressureTrigger>
          value={store.flowJitterTrigger}
          options={["none", "pressure"]}
          onChange={store.setFlowJitterTrigger}
        />

        <SliderField
          label="Min flow"
          value={store.minFlowJitter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setMinFlowJitter}
        />
      </ControlSection>

      <ControlSection id="spread" title="Spread">
        <ToggleField
          label="Enabled"
          checked={store.spreadEnabled}
          onChange={store.setSpreadEnabled}
        />

        <SliderField
          label="Range"
          value={store.spreadRange}
          min={0}
          max={2}
          step={0.01}
          onChange={store.setSpreadRange}
        />

        <SegmentedControl<PressureTrigger>
          value={store.spreadTrigger}
          options={["none", "pressure"]}
          onChange={store.setSpreadTrigger}
        />

        <SliderField
          label="Count"
          value={store.spreadCount}
          display={`${store.spreadCount}`}
          min={1}
          max={12}
          step={1}
          onChange={store.setSpreadCount}
        />

        <SliderField
          label="Count jitter"
          value={store.spreadCountJitter}
          min={0}
          max={1}
          step={0.01}
          onChange={store.setSpreadCountJitter}
        />

        <SegmentedControl<PressureTrigger>
          value={store.spreadCountJitterTrigger}
          options={["none", "pressure"]}
          onChange={store.setSpreadCountJitterTrigger}
        />
      </ControlSection>

      <ControlSection id="pattern" title="Pattern Texture">
        <ToggleField
          label="Enabled"
          checked={store.patternEnabled}
          onChange={store.setPatternEnabled}
        />

        <ImageControl
          label="Pattern Image"
          image={store.patternImage}
          onImageChange={store.setPatternImage}
        />

        <SliderField
          label="Scale"
          value={store.patternScale}
          min={0.25}
          max={4}
          step={0.05}
          onChange={store.setPatternScale}
        />

        <SliderField
          label="Brightness"
          value={store.patternBrightness}
          display={`${store.patternBrightness}%`}
          min={50}
          max={150}
          step={1}
          onChange={store.setPatternBrightness}
        />

        <SliderField
          label="Contrast"
          value={store.patternContrast}
          display={`${store.patternContrast}%`}
          min={50}
          max={150}
          step={1}
          onChange={store.setPatternContrast}
        />

        <div className="space-y-2">
          <Label>Tint</Label>
          <div className="grid grid-cols-[3rem_1fr] gap-2">
            <Input
              type="color"
              value={store.patternTint}
              onChange={(event) => store.setPatternTint(event.target.value)}
              className="cursor-pointer p-1"
            />
            <Input
              value={store.patternTint}
              onChange={(event) => store.setPatternTint(event.target.value)}
            />
          </div>
        </div>
      </ControlSection>

      <ControlSection id="actions" title="Canvas Actions" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={store.undoCanvas}>
            Undo
          </Button>

          <Button variant="outline" onClick={store.redoCanvas}>
            Redo
          </Button>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={store.clearCanvas}
        >
          Clear Canvas
        </Button>

        <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-2 text-xs text-muted-foreground">
          <IconPhoto className="size-4 shrink-0" />
          <span className="min-w-0 truncate">Transparent PNG stamps work best.</span>
        </div>
      </ControlSection>
    </div>
  );
}
