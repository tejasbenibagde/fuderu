// app/page.tsx

"use client";

import { useRef } from "react";
import AppHeader from "@/components/layout/app-header";
import AppSidebar from "@/components/layout/app-sidebar";
import FuderuCanvas, {
  FuderuHandle,
} from "@/components/canvas/fuderu-canvas";


export default function Home() {
  const canvasRef = useRef<FuderuHandle>(null);

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />

      <div className="flex flex-1">
        <AppSidebar
          onBrushChange={(b) => canvasRef.current?.setBrush(b)}
          onSizeChange={(s) => canvasRef.current?.setSize(s)}
          onOpacityChange={(o) => canvasRef.current?.setOpacity(o)}
          onClear={() => canvasRef.current?.clear()}
          onToggleEraser={(v) => canvasRef.current?.setInvert(v)}
        />

        <FuderuCanvas ref={canvasRef} />
      </div>
    </div>
  );
}