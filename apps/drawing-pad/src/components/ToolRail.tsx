import {
  Brush,
  Circle,
  CircleDashed,
  Eraser,
  Lasso,
  Minus,
  Move,
  PaintBucket,
  Pipette,
  Square,
  SquareDashed,
  Type,
} from "lucide-react";
import type { StudioTool } from "../types/studio";

interface ToolRailProps {
  activeTool: StudioTool;
  onSelectTool: (tool: StudioTool) => void;
}

const TOOL_GROUPS: readonly {
  group: string;
  items: readonly {
    id: StudioTool;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}[] = [
  {
    group: "Paint",
    items: [
      { id: "brush", label: "Brush (B)", icon: Brush },
      { id: "eraser", label: "Eraser (E)", icon: Eraser },
      { id: "bucket", label: "Flood Fill (G)", icon: PaintBucket },
      { id: "eyedropper", label: "Eyedropper (I)", icon: Pipette },
    ],
  },
  {
    group: "Shapes & Text",
    items: [
      { id: "rectangle", label: "Rectangle", icon: Square },
      { id: "ellipse", label: "Ellipse", icon: Circle },
      { id: "line", label: "Line", icon: Minus },
      { id: "text", label: "Text", icon: Type },
    ],
  },
  {
    group: "Selection & Transform",
    items: [
      { id: "rectSelect", label: "Rectangle Select", icon: SquareDashed },
      { id: "ellipseSelect", label: "Ellipse Select", icon: CircleDashed },
      { id: "lassoSelect", label: "Lasso Select", icon: Lasso },
      { id: "transform", label: "Transform (T)", icon: Move },
    ],
  },
];

export function ToolRail({ activeTool, onSelectTool }: ToolRailProps) {
  return (
    <aside
      aria-label="Drawing tools"
      className="w-14 shrink-0 border-r border-slate-800 bg-slate-900 py-3 flex flex-col items-center gap-3 overflow-y-auto"
    >
      {TOOL_GROUPS.map((section, idx) => (
        <div
          key={section.group}
          className={`flex flex-col items-center gap-1.5 ${
            idx < TOOL_GROUPS.length - 1 ? "border-b border-slate-800 pb-3" : ""
          }`}
        >
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = activeTool === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-pressed={active}
                title={item.label}
                onClick={() => onSelectTool(item.id)}
                className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
