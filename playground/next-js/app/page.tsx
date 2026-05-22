// app/page.tsx

import { AppSidebar } from "@/components/layout/app-sidebar";
import { CustomTrigger } from "@/components/layout/sidebar-trigger";

import { SidebarInset } from "@/components/ui/sidebar";
import Canvas from "./canvas";

export default function Home() {
  return (
    <>
      <AppSidebar />

      <SidebarInset className="flex flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <CustomTrigger />

            <div className="flex flex-col">
              <span className="text-sm font-semibold">Brush Playground</span>

              <span className="text-xs text-muted-foreground">
                Next.js Environment
              </span>
            </div>
          </div>
        </header>

        {/* Playground Area */}
        <main className="flex flex-1 overflow-hidden">
          {/* Canvas */}
          <Canvas />
        </main>
      </SidebarInset>
    </>
  );
}
