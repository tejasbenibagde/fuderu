import { useRef } from "react";
import {
  Download,
  FolderOpen,
  Play,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
} from "lucide-react";

interface TopBarProps {
  width: number;
  height: number;
  canUndo: boolean;
  canRedo: boolean;
  actionCount: number;
  isReplaying: boolean;
  replayProgress: number;
  onUndo: () => void;
  onRedo: () => void;
  onReplay: () => void;
  onReset: () => void;
  onSaveJSON: () => void;
  onImportJSON: (file: File) => void;
  onExportPNG: () => void;
}

export function TopBar({
  width,
  height,
  canUndo,
  canRedo,
  actionCount,
  isReplaying,
  replayProgress,
  onUndo,
  onRedo,
  onReplay,
  onReset,
  onSaveJSON,
  onImportJSON,
  onExportPNG,
}: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between gap-8">
      {/* Zone 1: Single-element brand wordmark */}
      <span
        className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Fuderu Studio
      </span>

      {/* Zone 2: Studio workspace controls & dimensions */}
      <nav
        aria-label="Workspace actions"
        className="flex items-center gap-2 overflow-x-auto"
      >
        <span className="hidden lg:inline-block text-xs text-slate-400 font-mono tabular-nums pr-2 whitespace-nowrap shrink-0">
          {width} × {height} px
        </span>

        <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onReplay}
          disabled={isReplaying || actionCount === 0}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
        >
          <Play className="h-3.5 w-3.5" />
          <span className="tabular-nums">
            {isReplaying
              ? `Replaying ${replayProgress}%`
              : `Replay (${actionCount})`}
          </span>
        </button>

        <button
          type="button"
          onClick={onSaveJSON}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Save Project</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Open</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.fuderu.json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportJSON(file);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Reset</span>
        </button>
      </nav>

      {/* Zone 3: Primary CTA */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onExportPNG}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export PNG</span>
        </button>
      </div>
    </header>
  );
}
