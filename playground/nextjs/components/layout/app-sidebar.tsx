"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar";

import { BrushControls } from "./brush-controls";

import { useBrushStore } from "../playground/brush-store";

export function AppSidebar() {
  const {
    size,
    radius,
    friction,
    opacity,
    color,
    eraser,

    setSize,
    setRadius,
    setFriction,
    setOpacity,
    setColor,
    setEraser,

    clearCanvas,
  } = useBrushStore();

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <Avatar>
            <AvatarImage src="/icon.png" />

            <AvatarFallback>
              FU
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              Fuderu
            </span>

            <span className="text-xs text-muted-foreground">
              Nextjs Playground
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Brush Engine
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <BrushControls
              size={size}
              radius={radius}
              friction={friction}
              opacity={opacity}
              color={color}
              eraser={eraser}
              onSizeChange={setSize}
              onRadiusChange={setRadius}
              onFrictionChange={setFriction}
              onOpacityChange={setOpacity}
              onColorChange={setColor}
              onEraserChange={setEraser}
              onClear={clearCanvas}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}