// components/layout/app-sidebar.tsx

"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BrushControls } from "./brush-controls";
import { LayersPanel } from "./layers-panel";
import type { LayerInfo } from "@/hooks/use-layer-manager";
import { IconLayersOff, IconBrush } from "@tabler/icons-react";

interface AppSidebarProps {
  layers?: LayerInfo[];
  activeLayerId?: string;
  onCreateLayer?: () => void;
  onDeleteLayer?: (id: string) => void;
  onRenameLayer?: (id: string, name: string) => void;
  onToggleVisibility?: (id: string, visible: boolean) => void;
  onSetOpacity?: (id: string, opacity: number) => void;
  onSelectLayer?: (id: string) => void;
  onDuplicateLayer?: (id: string) => void;
}

export function AppSidebar({
  layers = [],
  activeLayerId = "",
  onCreateLayer = () => {},
  onDeleteLayer = () => {},
  onRenameLayer = () => {},
  onToggleVisibility = () => {},
  onSetOpacity = () => {},
  onSelectLayer = () => {},
  onDuplicateLayer = () => {},
}: AppSidebarProps) {
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="border-b">
        <div className="px-2 py-2">
          <div className="flex h-12 w-full items-center overflow-hidden rounded-md">
            <img
              src="/fuderu.png"
              alt="Fuderu"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <Tabs defaultValue="layers" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="layers" className="gap-1 text-xs sm:text-sm">
              <IconLayersOff className="size-4" />
              <span className="hidden sm:inline">Layers</span>
            </TabsTrigger>
            <TabsTrigger value="brush" className="gap-1 text-xs sm:text-sm">
              <IconBrush className="size-4" />
              <span className="hidden sm:inline">Brush</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="layers"
            className="flex-1 mt-0 data-[state=inactive]:hidden"
          >
            <LayersPanel
              layers={layers}
              activeLayerId={activeLayerId}
              onCreateLayer={onCreateLayer}
              onDeleteLayer={onDeleteLayer}
              onRenameLayer={onRenameLayer}
              onToggleVisibility={onToggleVisibility}
              onSetOpacity={onSetOpacity}
              onSelectLayer={onSelectLayer}
              onDuplicateLayer={onDuplicateLayer}
            />
          </TabsContent>

          <TabsContent
            value="brush"
            className="flex-1 mt-0 data-[state=inactive]:hidden"
          >
            <BrushControls />
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  );
}
