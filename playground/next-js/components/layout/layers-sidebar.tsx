// components/layout/layers-sidebar.tsx

"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { LayersPanel } from "./layers-panel";
import type { LayerInfo } from "@/hooks/use-layer-manager";
import { IconLayersOff } from "@tabler/icons-react";

interface LayersSidebarProps {
  layers?: LayerInfo[];
  activeLayerId?: string;
  onCreateLayer?: () => void;
  onDeleteLayer?: (id: string) => void;
  onRenameLayer?: (id: string, name: string) => void;
  onToggleVisibility?: (id: string, visible: boolean) => void;
  onSetOpacity?: (id: string, opacity: number) => void;
  onSelectLayer?: (id: string) => void;
  onDuplicateLayer?: (id: string) => void;
  onSetBlendMode?: (id: string, blendMode: string) => void;
}

export function LayersSidebar({
  layers = [],
  activeLayerId = "",
  onCreateLayer = () => {},
  onDeleteLayer = () => {},
  onRenameLayer = () => {},
  onToggleVisibility = () => {},
  onSetOpacity = () => {},
  onSelectLayer = () => {},
  onDuplicateLayer = () => {},
  onSetBlendMode = () => {},
}: LayersSidebarProps) {
  return (
    <Sidebar variant="floating" side="right">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <IconLayersOff className="size-4" />
          <h2 className="text-sm font-semibold">Layers</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            ({layers.length})
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
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
          onSetBlendMode={onSetBlendMode}
        />
      </SidebarContent>
    </Sidebar>
  );
}
