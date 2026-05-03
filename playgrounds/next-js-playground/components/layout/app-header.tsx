"use client";

import { GitMerge } from "lucide-react";
 
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export default function AppHeader() {
  return (
    <header className="h-14 border-b flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold">🎨 Fuderu</h1>

      <div className="flex items-center gap-2">
        <ModeToggle />

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            window.open("https://github.com/your-repo", "_blank")
          }
        >
          <GitMerge className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}