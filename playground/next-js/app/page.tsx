"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { CustomTrigger } from "@/components/layout/sidebar-trigger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SidebarInset } from "@/components/ui/sidebar";
import Canvas from "./canvas";
import { IconArrowRight, IconBrush, IconFilePlus } from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";

export type PlaygroundProject = {
  id: number;
  name: string;
  width: number;
  height: number;
};

const presets = [
  { label: "Square", width: 1536, height: 1536 },
  { label: "Portrait", width: 1440, height: 1920 },
  { label: "Landscape", width: 1920, height: 1080 },
];

export default function Home() {
  const [project, setProject] = useState<PlaygroundProject | null>(null);
  const [name, setName] = useState("Untitled Canvas");
  const [width, setWidth] = useState(1536);
  const [height, setHeight] = useState(1536);

  const createProject = () => {
    setProject({
      id: Date.now(),
      name: name.trim() || "Untitled Canvas",
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    });
  };

  if (!project) {
    return (
      <main className="flex min-h-screen bg-muted/30">
        <section className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(360px,480px)_1fr]">
          <div className="flex flex-col justify-center border-r bg-background px-6 py-8 sm:px-10">
            <div className="mb-8 flex h-16 items-center">
              <Image
                src="/fuderu.png"
                alt="Fuderu"
                width={220}
                height={80}
                className="h-full w-auto object-contain"
                unoptimized
                priority
              />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <IconBrush className="size-3.5" />
                Fuderu 0.8.6 Playground
              </div>

              <h1 className="text-3xl font-semibold tracking-normal">
                Create a drawing project
              </h1>

              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Choose a logical canvas size before entering the editor. The
                workspace will scale the view while Fuderu keeps the artwork at
                the selected resolution.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={
                      width === preset.width && height === preset.height
                        ? "default"
                        : "outline"
                    }
                    className="h-auto flex-col items-start gap-1 px-3 py-2"
                    onClick={() => {
                      setWidth(preset.width);
                      setHeight(preset.height);
                    }}
                  >
                    <span>{preset.label}</span>
                    <span className="text-xs opacity-70">
                      {preset.width} x {preset.height}
                    </span>
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="canvas-width">Width</Label>
                  <Input
                    id="canvas-width"
                    type="number"
                    min={1}
                    value={width}
                    onChange={(event) => setWidth(Number(event.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canvas-height">Height</Label>
                  <Input
                    id="canvas-height"
                    type="number"
                    min={1}
                    value={height}
                    onChange={(event) => setHeight(Number(event.target.value))}
                  />
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={createProject}
              >
                <IconFilePlus className="size-4" />
                Create project
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="hidden items-center justify-center p-10 lg:flex">
            <div className="relative aspect-square w-full max-w-[560px] overflow-hidden rounded-lg border bg-background shadow-sm">
              <div className="absolute inset-8 rounded-md border border-dashed bg-[linear-gradient(45deg,rgba(0,0,0,0.04)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.04)_75%),linear-gradient(45deg,rgba(0,0,0,0.04)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.04)_75%)] bg-[length:32px_32px] bg-[position:0_0,16px_16px]" />
              <div className="absolute left-16 top-20 h-20 w-40 rotate-[-8deg] rounded-md border bg-teal-500/10" />
              <div className="absolute bottom-20 right-16 h-24 w-32 rotate-12 rounded-md border bg-rose-500/10" />
              <div className="absolute inset-x-20 bottom-24 h-2 rounded-full bg-foreground/10" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <AppSidebar />

      <SidebarInset className="flex flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <CustomTrigger />

            <div className="flex flex-col">
              <span className="text-sm font-semibold">{project.name}</span>

              <span className="text-xs text-muted-foreground">
                {project.width} x {project.height} document
              </span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setProject(null)}>
            <IconFilePlus className="size-4" />
            New Project
          </Button>
        </header>

        {/* Playground Area */}
        <main className="flex flex-1 overflow-hidden">
          {/* Canvas */}
          <Canvas key={project.id} project={project} />
        </main>
      </SidebarInset>
    </>
  );
}
