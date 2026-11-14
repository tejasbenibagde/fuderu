import { useEffect, useRef } from "react";
import { CanvasStage } from "./components/CanvasStage";
import { InspectorSidebar } from "./components/InspectorSidebar";
import { ToolRail } from "./components/ToolRail";
import { TopBar } from "./components/TopBar";
import { useFuderuCanvas } from "./hooks/useFuderuCanvas";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const studio = useFuderuCanvas(canvasRef);

  const docWidth = studio.snapshot?.documentWidth ?? 1200;
  const docHeight = studio.snapshot?.documentHeight ?? 800;
  const activeLayerId = studio.snapshot?.activeLayerId ?? "";
  const canUndo = studio.snapshot?.history.canUndo ?? false;
  const canRedo = studio.snapshot?.history.canRedo ?? false;
  const hasSelection = studio.snapshot?.selection?.active ?? false;
  const isTransforming = studio.snapshot?.transform?.active ?? false;
  const hasClipboard = studio.snapshot?.clipboard?.hasData ?? false;

  // Global keyboard shortcuts (disabled when typing inside inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) studio.redo();
        else studio.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        studio.redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        studio.copySelection();
        return;
      }
      if (mod && e.key.toLowerCase() === "x") {
        e.preventDefault();
        studio.cutSelection();
        return;
      }
      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        studio.pasteClipboard(true);
        return;
      }

      switch (e.key.toLowerCase()) {
        case "b":
          studio.selectTool("brush");
          break;
        case "e":
          studio.selectTool("eraser");
          break;
        case "g":
          studio.selectTool("bucket");
          break;
        case "i":
          studio.selectTool("eyedropper");
          break;
        case "t":
          studio.selectTool("transform");
          break;
        case "escape":
          if (studio.engineRef.current?.isTransforming()) {
            studio.engineRef.current.cancelTransform();
            studio.selectTool("brush");
          } else if (studio.engineRef.current?.hasSelection()) {
            studio.engineRef.current.clearSelection();
          }
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [studio]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <TopBar
        width={docWidth}
        height={docHeight}
        canUndo={canUndo}
        canRedo={canRedo}
        actionCount={studio.actionCount}
        isReplaying={studio.isReplaying}
        replayProgress={studio.replayProgress}
        onUndo={studio.undo}
        onRedo={studio.redo}
        onReplay={studio.replayActions}
        onReset={studio.resetArtwork}
        onSaveJSON={studio.exportJSON}
        onImportJSON={studio.importJSON}
        onExportPNG={studio.exportPNG}
      />

      <div className="flex-1 min-h-0 flex">
        <ToolRail
          activeTool={studio.activeTool}
          onSelectTool={studio.selectTool}
        />

        <CanvasStage
          canvasRef={canvasRef}
          engineRef={studio.engineRef}
          docWidth={docWidth}
          docHeight={docHeight}
          zoom={studio.zoom}
          onZoomChange={studio.setZoom}
          activeTool={studio.activeTool}
          brushState={studio.brushState}
          shapeOptions={studio.shapeOptions}
          selectionMode={studio.selectionMode}
          hasSelection={hasSelection}
          isTransforming={isTransforming}
          notice={studio.notice}
          onDismissNotice={studio.clearNotice}
          onPickColor={(color) => studio.updateBrush({ color })}
          onSelectTool={studio.selectTool}
          onShowNotice={studio.showNotice}
          onSync={() => {
            if (studio.engineRef.current) {
              studio.syncFromEngine(studio.engineRef.current);
            }
          }}
        />

        <InspectorSidebar
          activeTool={studio.activeTool}
          brushState={studio.brushState}
          shapeOptions={studio.shapeOptions}
          selectionMode={studio.selectionMode}
          layers={studio.layers}
          activeLayerId={activeLayerId}
          previewTick={studio.previewTick}
          hasSelection={hasSelection}
          hasClipboard={hasClipboard}
          docWidth={docWidth}
          docHeight={docHeight}
          onUpdateBrush={studio.updateBrush}
          onUpdateShapeOptions={studio.setShapeOptions}
          onSelectionModeChange={studio.setSelectionMode}
          onLoadBrushTip={studio.loadBrushTip}
          onClearBrushTip={studio.clearBrushTip}
          onCreateLayer={studio.createLayer}
          onSelectLayer={studio.setActiveLayer}
          onToggleVisibility={studio.toggleLayerVisibility}
          onToggleAlphaLock={studio.toggleAlphaLock}
          onToggleLock={studio.toggleLayerLock}
          onSetLayerOpacity={studio.setLayerOpacity}
          onSetLayerBlendMode={studio.setLayerBlendMode}
          onRenameLayer={studio.renameLayer}
          onMoveLayer={studio.moveLayer}
          onDuplicateLayer={studio.duplicateLayer}
          onDeleteLayer={studio.deleteLayer}
          onClearLayer={studio.clearActiveLayer}
          onSelectAll={() => studio.engineRef.current?.selectAllSelection()}
          onInvertSelection={() => studio.engineRef.current?.invertSelection()}
          onClearSelection={() => studio.engineRef.current?.clearSelection()}
          onCopy={studio.copySelection}
          onCut={studio.cutSelection}
          onPaste={() => studio.pasteClipboard(true)}
          onResizeDocument={studio.resizeDocument}
        />
      </div>
    </div>
  );
}

export default App;
