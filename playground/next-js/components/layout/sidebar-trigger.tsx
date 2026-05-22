"use client";

import { IconLayoutSidebar } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function CustomTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="h-8 w-8"
    >
      <IconLayoutSidebar className="h-4 w-4" />
    </Button>
  );
}
