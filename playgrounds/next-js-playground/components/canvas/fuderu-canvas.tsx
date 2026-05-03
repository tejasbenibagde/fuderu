"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Fuderu from "fuderu";

export type FuderuHandle = {
  setBrush: (b: string) => void;
  setSize: (s: number) => void;
  setOpacity: (o: number) => void;
  clear: () => void;
  setInvert: (v: boolean) => void;
};

const FuderuCanvas = forwardRef<FuderuHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const painterRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const painter = new Fuderu({
      canvas: canvasRef.current,
      color: "#000000",
      size: 10,
      opacity: 1,
    });

    painterRef.current = painter;

    return () => painter.destroy();
  }, []);

  useImperativeHandle(ref, () => ({
    setBrush: (b) => painterRef.current?.useBrush(b),
    setSize: (s) => painterRef.current?.setSize(s),
    setOpacity: (o) => painterRef.current?.setOpacity(o),
    clear: () => painterRef.current?.clear(),
    setInvert: (v) => {
      painterRef.current?.setInvert(v);
      painterRef.current?.brushEngine?.endStroke?.();
    },
  }));

  return (
    <div className="flex-1 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="bg-white rounded-md shadow"
      />
    </div>
  );
});

export default FuderuCanvas;