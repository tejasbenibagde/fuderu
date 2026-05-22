// components/layout/app-sidebar.tsx

"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

import { BrushControls } from "./brush-controls";

import { useBrushStore } from "../playground/brush-store";

export function AppSidebar() {
  const {
    size,
    opacity,
    color,

    spacing,
    flow,
    roundness,
    image,

    smooth,

    setSize,
    setOpacity,
    setColor,

    setSpacing,
    setFlow,
    setRoundness,
    setImage,

    setSmooth,

    clearCanvas,
    undoCanvas,
    redoCanvas,
  } = useBrushStore();

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar>
            <AvatarImage src="/icon.png" />

            <AvatarFallback>FU</AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <span className="text-sm font-semibold">Fuderu</span>

            <span className="text-xs text-muted-foreground">
              Next.js Playground
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Brush Engine</SidebarGroupLabel>

          <SidebarGroupContent>
            <BrushControls
              size={size}
              opacity={opacity}
              color={color}
              spacing={spacing}
              flow={flow}
              roundness={roundness}
              smooth={smooth}
              onSizeChange={setSize}
              image={image}
              onOpacityChange={setOpacity}
              onColorChange={setColor}
              onSpacingChange={setSpacing}
              onFlowChange={setFlow}
              onRoundnessChange={setRoundness}
              onSmoothChange={setSmooth}
              onImageChange={setImage}
              onClear={clearCanvas}
              onUndo={undoCanvas}
              onRedo={redoCanvas}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
