import { vi } from "vitest";

interface CanvasBufferState {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

interface CtxSavedState {
  matrix: [number, number, number, number, number, number];
  globalAlpha: number;
  globalCompositeOperation: GlobalCompositeOperation;
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
  lineDash: number[];
  lineDashOffset: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  filter: string;
  clipMask: Uint8Array | null;
}

type PathOp =
  | { kind: "moveTo"; x: number; y: number }
  | { kind: "lineTo"; x: number; y: number }
  | { kind: "closePath" }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | {
      kind: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      rotation: number;
    };

const NAMED_COLORS: Record<string, [number, number, number, number]> = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 255],
  white: [255, 255, 255, 255],
  red: [255, 0, 0, 255],
  green: [0, 128, 0, 255],
  lime: [0, 255, 0, 255],
  blue: [0, 0, 255, 255],
  yellow: [255, 255, 0, 255],
  cyan: [0, 255, 255, 255],
  magenta: [255, 0, 255, 255],
  gray: [128, 128, 128, 255],
  grey: [128, 128, 128, 255],
  orange: [255, 165, 0, 255],
  purple: [128, 0, 128, 255],
};

export function parseCssRgba(
  style: string | CanvasGradient | CanvasPattern,
): [number, number, number, number] {
  if (typeof style !== "string") {
    return [255, 255, 255, 255];
  }
  const s = style.trim().toLowerCase();
  if (NAMED_COLORS[s]) {
    return NAMED_COLORS[s];
  }
  if (s.startsWith("#")) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        255,
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        255,
      ];
    }
    if (hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        parseInt(hex.slice(6, 8), 16),
      ];
    }
  }
  const rgbaMatch = s.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (rgbaMatch) {
    const r = Math.min(255, Math.max(0, Math.round(Number(rgbaMatch[1]))));
    const g = Math.min(255, Math.max(0, Math.round(Number(rgbaMatch[2]))));
    const b = Math.min(255, Math.max(0, Math.round(Number(rgbaMatch[3]))));
    const a =
      rgbaMatch[4] !== undefined
        ? Math.min(255, Math.max(0, Math.round(Number(rgbaMatch[4]) * 255)))
        : 255;
    return [r, g, b, a];
  }
  return [0, 0, 0, 255];
}

function mulMatrix(
  m1: [number, number, number, number, number, number],
  m2: [number, number, number, number, number, number],
): [number, number, number, number, number, number] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function invertMatrix(
  m: [number, number, number, number, number, number],
): [number, number, number, number, number, number] | null {
  const det = m[0] * m[3] - m[1] * m[2];
  if (Math.abs(det) < 1e-10) return null;
  const invDet = 1 / det;
  return [
    m[3] * invDet,
    -m[1] * invDet,
    -m[2] * invDet,
    m[0] * invDet,
    (m[2] * m[5] - m[3] * m[4]) * invDet,
    (m[1] * m[4] - m[0] * m[5]) * invDet,
  ];
}

function applyMatrix(
  m: [number, number, number, number, number, number],
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5],
  };
}

function pointInPolygon(
  x: number,
  y: number,
  poly: Array<{ x: number; y: number }>,
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function compositePixel(
  dst: Uint8ClampedArray,
  idx: number,
  sr: number,
  sg: number,
  sb: number,
  saByte: number,
  gco: GlobalCompositeOperation,
): void {
  const dr = dst[idx];
  const dg = dst[idx + 1];
  const db = dst[idx + 2];
  const daByte = dst[idx + 3];

  const sa = saByte / 255;
  const da = daByte / 255;

  if (gco === "destination-in") {
    const outA = da * sa;
    dst[idx + 3] = Math.round(outA * 255);
    if (dst[idx + 3] === 0) {
      dst[idx] = 0;
      dst[idx + 1] = 0;
      dst[idx + 2] = 0;
    }
    return;
  }

  if (gco === "destination-out") {
    const outA = da * (1 - sa);
    dst[idx + 3] = Math.round(outA * 255);
    if (dst[idx + 3] === 0) {
      dst[idx] = 0;
      dst[idx + 1] = 0;
      dst[idx + 2] = 0;
    }
    return;
  }

  if (gco === "source-atop") {
    if (daByte === 0) return;
    if (saByte === 0) return;
    dst[idx] = Math.round(sr * sa + dr * (1 - sa));
    dst[idx + 1] = Math.round(sg * sa + dg * (1 - sa));
    dst[idx + 2] = Math.round(sb * sa + db * (1 - sa));
    dst[idx + 3] = daByte;
    return;
  }

  if (gco === "copy") {
    dst[idx] = sr;
    dst[idx + 1] = sg;
    dst[idx + 2] = sb;
    dst[idx + 3] = saByte;
    return;
  }

  // source-over & general blend modes
  if (saByte === 0) return;

  let br = sr;
  let bg = sg;
  let bb = sb;

  if (gco === "multiply" && daByte > 0) {
    br = Math.round((sr * dr) / 255);
    bg = Math.round((sg * dg) / 255);
    bb = Math.round((sb * db) / 255);
  } else if (gco === "screen" && daByte > 0) {
    br = 255 - Math.round(((255 - sr) * (255 - dr)) / 255);
    bg = 255 - Math.round(((255 - sg) * (255 - dg)) / 255);
    bb = 255 - Math.round(((255 - sb) * (255 - db)) / 255);
  }

  if (saByte === 255 || daByte === 0) {
    dst[idx] = br;
    dst[idx + 1] = bg;
    dst[idx + 2] = bb;
    dst[idx + 3] = saByte;
    return;
  }

  const outA = sa + da * (1 - sa);
  if (outA <= 0) {
    dst[idx] = 0;
    dst[idx + 1] = 0;
    dst[idx + 2] = 0;
    dst[idx + 3] = 0;
    return;
  }
  dst[idx] = Math.round((br * sa + dr * da * (1 - sa)) / outA);
  dst[idx + 1] = Math.round((bg * sa + dg * da * (1 - sa)) / outA);
  dst[idx + 2] = Math.round((bb * sa + db * da * (1 - sa)) / outA);
  dst[idx + 3] = Math.round(outA * 255);
}

export interface Canvas2DMockEnvironment {
  getBuffer(canvas: HTMLCanvasElement): Uint8ClampedArray;
  getPixel(
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
  ): [number, number, number, number];
  countNonTransparentPixels(canvas: HTMLCanvasElement): number;
  encodedSnapshots: Map<string, CanvasBufferState>;
  restore(): void;
}

export function installCanvas2DMock(): Canvas2DMockEnvironment {
  const buffers = new WeakMap<HTMLCanvasElement, CanvasBufferState>();
  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  const encodedSnapshots = new Map<string, CanvasBufferState>();
  let snapshotCounter = 0;

  const ensureBuffer = (canvas: HTMLCanvasElement): CanvasBufferState => {
    const cw = Math.max(0, canvas.width | 0);
    const ch = Math.max(0, canvas.height | 0);
    const existing = buffers.get(canvas);
    if (!existing || existing.width !== cw || existing.height !== ch) {
      const state: CanvasBufferState = {
        width: cw,
        height: ch,
        data: new Uint8ClampedArray(cw * ch * 4),
      };
      buffers.set(canvas, state);
      return state;
    }
    return existing;
  };

  const getContextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(function (this: HTMLCanvasElement, contextId: string) {
      if (contextId !== "2d") return null;

      ensureBuffer(this);
      const cached = contexts.get(this);
      if (cached) return cached;

      let state: CtxSavedState = {
        matrix: [1, 0, 0, 1, 0, 0],
        globalAlpha: 1,
        globalCompositeOperation: "source-over",
        fillStyle: "#000000",
        strokeStyle: "#000000",
        lineWidth: 1,
        lineCap: "butt",
        lineDash: [],
        lineDashOffset: 0,
        font: "10px sans-serif",
        textAlign: "start",
        textBaseline: "alphabetic",
        filter: "none",
        clipMask: null,
      };
      const stack: CtxSavedState[] = [];
      let pathOps: PathOp[] = [];
      let curX = 0;
      let curY = 0;

      const cloneState = (s: CtxSavedState): CtxSavedState => ({
        ...s,
        matrix: [...s.matrix] as [
          number,
          number,
          number,
          number,
          number,
          number,
        ],
        lineDash: [...s.lineDash],
        clipMask: s.clipMask ? new Uint8Array(s.clipMask) : null,
      });

      const writePixel = (
        bufState: CanvasBufferState,
        px: number,
        py: number,
        r: number,
        g: number,
        b: number,
        a: number,
      ) => {
        if (px < 0 || py < 0 || px >= bufState.width || py >= bufState.height) {
          return;
        }
        if (state.clipMask && state.clipMask[py * bufState.width + px] === 0) {
          return;
        }
        const effectiveA = Math.round(a * state.globalAlpha);
        const idx = (py * bufState.width + px) * 4;
        compositePixel(
          bufState.data,
          idx,
          r,
          g,
          b,
          effectiveA,
          state.globalCompositeOperation,
        );
      };

      const evaluatePathMask = (
        bufState: CanvasBufferState,
        mode: "fill" | "stroke",
      ): Uint8Array => {
        const w = bufState.width;
        const h = bufState.height;
        const mask = new Uint8Array(w * h);
        if (w <= 0 || h <= 0 || pathOps.length === 0) return mask;

        const inv = invertMatrix(state.matrix);
        if (!inv) return mask;

        // Collect subpaths (polygons), rects, and ellipses in path-local coordinates
        const polygons: Array<{
          points: Array<{ x: number; y: number }>;
          closed: boolean;
        }> = [];
        const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
        const ellipses: Array<{
          cx: number;
          cy: number;
          rx: number;
          ry: number;
          rotation: number;
        }> = [];

        let currentPoly: Array<{ x: number; y: number }> = [];
        for (const op of pathOps) {
          if (op.kind === "moveTo") {
            if (currentPoly.length > 0) {
              polygons.push({ points: currentPoly, closed: false });
            }
            currentPoly = [{ x: op.x, y: op.y }];
          } else if (op.kind === "lineTo") {
            currentPoly.push({ x: op.x, y: op.y });
          } else if (op.kind === "closePath") {
            if (currentPoly.length > 0) {
              polygons.push({ points: currentPoly, closed: true });
              currentPoly = [];
            }
          } else if (op.kind === "rect") {
            rects.push({ x: op.x, y: op.y, w: op.w, h: op.h });
          } else if (op.kind === "ellipse") {
            ellipses.push({
              cx: op.cx,
              cy: op.cy,
              rx: op.rx,
              ry: op.ry,
              rotation: op.rotation,
            });
          }
        }
        if (currentPoly.length > 0) {
          polygons.push({ points: currentPoly, closed: false });
        }

        const halfStroke = Math.max(0.5, state.lineWidth / 2);

        for (let py = 0; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const local = applyMatrix(inv, px + 0.5, py + 0.5);
            let hit = false;

            if (mode === "fill") {
              for (const r of rects) {
                const rx1 = Math.min(r.x, r.x + r.w);
                const rx2 = Math.max(r.x, r.x + r.w);
                const ry1 = Math.min(r.y, r.y + r.h);
                const ry2 = Math.max(r.y, r.y + r.h);
                if (
                  local.x >= rx1 &&
                  local.x <= rx2 &&
                  local.y >= ry1 &&
                  local.y <= ry2
                ) {
                  hit = true;
                  break;
                }
              }
              if (!hit) {
                for (const e of ellipses) {
                  if (e.rx <= 0 || e.ry <= 0) continue;
                  const dx = local.x - e.cx;
                  const dy = local.y - e.cy;
                  const cos = Math.cos(-e.rotation);
                  const sin = Math.sin(-e.rotation);
                  const lx = dx * cos - dy * sin;
                  const ly = dx * sin + dy * cos;
                  if (
                    (lx * lx) / (e.rx * e.rx) + (ly * ly) / (e.ry * e.ry) <=
                    1.0001
                  ) {
                    hit = true;
                    break;
                  }
                }
              }
              if (!hit) {
                for (const p of polygons) {
                  if (
                    p.points.length >= 3 &&
                    pointInPolygon(local.x, local.y, p.points)
                  ) {
                    hit = true;
                    break;
                  }
                }
              }
            } else {
              // Stroke mode
              for (const r of rects) {
                const rx1 = Math.min(r.x, r.x + r.w);
                const rx2 = Math.max(r.x, r.x + r.w);
                const ry1 = Math.min(r.y, r.y + r.h);
                const ry2 = Math.max(r.y, r.y + r.h);
                const dTop = distToSegment(
                  local.x,
                  local.y,
                  rx1,
                  ry1,
                  rx2,
                  ry1,
                );
                const dRight = distToSegment(
                  local.x,
                  local.y,
                  rx2,
                  ry1,
                  rx2,
                  ry2,
                );
                const dBottom = distToSegment(
                  local.x,
                  local.y,
                  rx2,
                  ry2,
                  rx1,
                  ry2,
                );
                const dLeft = distToSegment(
                  local.x,
                  local.y,
                  rx1,
                  ry2,
                  rx1,
                  ry1,
                );
                if (
                  Math.min(dTop, dRight, dBottom, dLeft) <=
                  halfStroke + 0.5
                ) {
                  hit = true;
                  break;
                }
              }
              if (!hit) {
                for (const e of ellipses) {
                  if (e.rx <= 0 || e.ry <= 0) continue;
                  const dx = local.x - e.cx;
                  const dy = local.y - e.cy;
                  const cos = Math.cos(-e.rotation);
                  const sin = Math.sin(-e.rotation);
                  const lx = dx * cos - dy * sin;
                  const ly = dx * sin + dy * cos;
                  const norm = Math.sqrt(
                    (lx * lx) / (e.rx * e.rx) + (ly * ly) / (e.ry * e.ry),
                  );
                  const approxRadius = (e.rx + e.ry) / 2;
                  const radialDist = Math.abs(norm - 1) * approxRadius;
                  if (radialDist <= halfStroke + 0.5) {
                    hit = true;
                    break;
                  }
                }
              }
              if (!hit) {
                for (const poly of polygons) {
                  const pts = poly.points;
                  for (let i = 0; i < pts.length - 1; i++) {
                    if (
                      distToSegment(
                        local.x,
                        local.y,
                        pts[i].x,
                        pts[i].y,
                        pts[i + 1].x,
                        pts[i + 1].y,
                      ) <=
                      halfStroke + 0.5
                    ) {
                      hit = true;
                      break;
                    }
                  }
                  if (!hit && poly.closed && pts.length > 2) {
                    if (
                      distToSegment(
                        local.x,
                        local.y,
                        pts[pts.length - 1].x,
                        pts[pts.length - 1].y,
                        pts[0].x,
                        pts[0].y,
                      ) <=
                      halfStroke + 0.5
                    ) {
                      hit = true;
                    }
                  }
                  if (hit) break;
                }
              }
            }

            if (hit) {
              mask[py * w + px] = 1;
            }
          }
        }

        return mask;
      };

      const ctxMock = {
        canvas: this,
        get globalAlpha() {
          return state.globalAlpha;
        },
        set globalAlpha(v: number) {
          if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1) {
            state.globalAlpha = v;
          }
        },
        get globalCompositeOperation() {
          return state.globalCompositeOperation;
        },
        set globalCompositeOperation(v: GlobalCompositeOperation) {
          state.globalCompositeOperation = v;
        },
        get fillStyle() {
          return state.fillStyle;
        },
        set fillStyle(v: string | CanvasGradient | CanvasPattern) {
          state.fillStyle = v;
        },
        get strokeStyle() {
          return state.strokeStyle;
        },
        set strokeStyle(v: string | CanvasGradient | CanvasPattern) {
          state.strokeStyle = v;
        },
        get lineWidth() {
          return state.lineWidth;
        },
        set lineWidth(v: number) {
          if (typeof v === "number" && v > 0) state.lineWidth = v;
        },
        get lineCap() {
          return state.lineCap;
        },
        set lineCap(v: CanvasLineCap) {
          state.lineCap = v;
        },
        get lineDashOffset() {
          return state.lineDashOffset;
        },
        set lineDashOffset(v: number) {
          state.lineDashOffset = v;
        },
        get font() {
          return state.font;
        },
        set font(v: string) {
          state.font = v;
        },
        get textAlign() {
          return state.textAlign;
        },
        set textAlign(v: CanvasTextAlign) {
          state.textAlign = v;
        },
        get textBaseline() {
          return state.textBaseline;
        },
        set textBaseline(v: CanvasTextBaseline) {
          state.textBaseline = v;
        },
        get filter() {
          return state.filter;
        },
        set filter(v: string) {
          state.filter = v;
        },
        setLineDash: vi.fn((segments: number[]) => {
          state.lineDash = [...segments];
        }),
        getLineDash: vi.fn(() => [...state.lineDash]),
        save: vi.fn(() => {
          stack.push(cloneState(state));
        }),
        restore: vi.fn(() => {
          const prev = stack.pop();
          if (prev) state = prev;
        }),
        setTransform: vi.fn(
          (
            a: number,
            b: number,
            c: number,
            d: number,
            e: number,
            f: number,
          ) => {
            state.matrix = [a, b, c, d, e, f];
          },
        ),
        translate: vi.fn((tx: number, ty: number) => {
          state.matrix = mulMatrix(state.matrix, [1, 0, 0, 1, tx, ty]);
        }),
        rotate: vi.fn((angle: number) => {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          state.matrix = mulMatrix(state.matrix, [cos, sin, -sin, cos, 0, 0]);
        }),
        scale: vi.fn((sx: number, sy: number) => {
          state.matrix = mulMatrix(state.matrix, [sx, 0, 0, sy, 0, 0]);
        }),
        beginPath: vi.fn(() => {
          pathOps = [];
        }),
        closePath: vi.fn(() => {
          pathOps.push({ kind: "closePath" });
        }),
        moveTo: vi.fn((x: number, y: number) => {
          curX = x;
          curY = y;
          pathOps.push({ kind: "moveTo", x, y });
        }),
        lineTo: vi.fn((x: number, y: number) => {
          curX = x;
          curY = y;
          pathOps.push({ kind: "lineTo", x, y });
        }),
        rect: vi.fn((x: number, y: number, w: number, h: number) => {
          curX = x;
          curY = y;
          pathOps.push({ kind: "rect", x, y, w, h });
        }),
        roundRect: vi.fn(
          (x: number, y: number, w: number, h: number, _radius?: number) => {
            void _radius;
            curX = x;
            curY = y;
            pathOps.push({ kind: "rect", x, y, w, h });
          },
        ),
        ellipse: vi.fn(
          (
            cx: number,
            cy: number,
            rx: number,
            ry: number,
            rotation: number = 0,
          ) => {
            pathOps.push({
              kind: "ellipse",
              cx,
              cy,
              rx: Math.abs(rx),
              ry: Math.abs(ry),
              rotation,
            });
          },
        ),
        arc: vi.fn((cx: number, cy: number, radius: number) => {
          pathOps.push({
            kind: "ellipse",
            cx,
            cy,
            rx: Math.abs(radius),
            ry: Math.abs(radius),
            rotation: 0,
          });
        }),
        clip: vi.fn(() => {
          const bufState = ensureBuffer(this);
          const mask = evaluatePathMask(bufState, "fill");
          if (state.clipMask) {
            for (let i = 0; i < mask.length; i++) {
              state.clipMask[i] = state.clipMask[i] && mask[i] ? 1 : 0;
            }
          } else {
            state.clipMask = mask;
          }
        }),
        fill: vi.fn(() => {
          const bufState = ensureBuffer(this);
          const mask = evaluatePathMask(bufState, "fill");
          const [r, g, b, a] = parseCssRgba(state.fillStyle);
          const gco = state.globalCompositeOperation;
          const clearOutside = gco === "destination-in" || gco === "copy";
          for (let py = 0; py < bufState.height; py++) {
            for (let px = 0; px < bufState.width; px++) {
              if (mask[py * bufState.width + px]) {
                writePixel(bufState, px, py, r, g, b, a);
              } else if (clearOutside) {
                writePixel(bufState, px, py, 0, 0, 0, 0);
              }
            }
          }
        }),
        stroke: vi.fn(() => {
          const bufState = ensureBuffer(this);
          const mask = evaluatePathMask(bufState, "stroke");
          const [r, g, b, a] = parseCssRgba(state.strokeStyle);
          for (let py = 0; py < bufState.height; py++) {
            for (let px = 0; px < bufState.width; px++) {
              if (mask[py * bufState.width + px]) {
                writePixel(bufState, px, py, r, g, b, a);
              }
            }
          }
        }),
        fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
          const bufState = ensureBuffer(this);
          const [r, g, b, a] = parseCssRgba(state.fillStyle);
          const inv = invertMatrix(state.matrix);
          if (!inv) return;
          const x1 = Math.min(x, x + w);
          const x2 = Math.max(x, x + w);
          const y1 = Math.min(y, y + h);
          const y2 = Math.max(y, y + h);
          const gco = state.globalCompositeOperation;
          const clearOutside = gco === "destination-in" || gco === "copy";
          for (let py = 0; py < bufState.height; py++) {
            for (let px = 0; px < bufState.width; px++) {
              const local = applyMatrix(inv, px + 0.5, py + 0.5);
              if (
                local.x >= x1 &&
                local.x < x2 &&
                local.y >= y1 &&
                local.y < y2
              ) {
                writePixel(bufState, px, py, r, g, b, a);
              } else if (clearOutside) {
                writePixel(bufState, px, py, 0, 0, 0, 0);
              }
            }
          }
        }),
        strokeRect: vi.fn((x: number, y: number, w: number, h: number) => {
          const savedPath = pathOps;
          pathOps = [{ kind: "rect", x, y, w, h }];
          ctxMock.stroke();
          pathOps = savedPath;
        }),
        clearRect: vi.fn((x: number, y: number, w: number, h: number) => {
          const bufState = ensureBuffer(this);
          const inv = invertMatrix(state.matrix);
          if (!inv) return;
          const x1 = Math.min(x, x + w);
          const x2 = Math.max(x, x + w);
          const y1 = Math.min(y, y + h);
          const y2 = Math.max(y, y + h);
          for (let py = 0; py < bufState.height; py++) {
            for (let px = 0; px < bufState.width; px++) {
              const local = applyMatrix(inv, px + 0.5, py + 0.5);
              if (
                local.x >= x1 &&
                local.x < x2 &&
                local.y >= y1 &&
                local.y < y2
              ) {
                if (
                  state.clipMask &&
                  state.clipMask[py * bufState.width + px] === 0
                ) {
                  continue;
                }
                const idx = (py * bufState.width + px) * 4;
                bufState.data[idx] = 0;
                bufState.data[idx + 1] = 0;
                bufState.data[idx + 2] = 0;
                bufState.data[idx + 3] = 0;
              }
            }
          }
        }),
        measureText: vi.fn((text: string) => {
          const sizeMatch = state.font.match(/(\d+(?:\.\d+)?)px/);
          const fontSize = sizeMatch ? Number(sizeMatch[1]) : 16;
          return {
            width: text.length * fontSize * 0.6,
          } as TextMetrics;
        }),
        fillText: vi.fn(
          (text: string, x: number, y: number, maxWidth?: number) => {
            if (!text) return;
            const bufState = ensureBuffer(this);
            const sizeMatch = state.font.match(/(\d+(?:\.\d+)?)px/);
            const fontSize = sizeMatch ? Number(sizeMatch[1]) : 16;
            const rawWidth = Math.max(
              4,
              Math.ceil(text.length * fontSize * 0.6),
            );
            const w = maxWidth ? Math.min(rawWidth, maxWidth) : rawWidth;
            const h = Math.max(4, Math.ceil(fontSize));

            let left = x;
            if (state.textAlign === "center") left = x - w / 2;
            else if (state.textAlign === "right" || state.textAlign === "end")
              left = x - w;

            let top = y;
            if (state.textBaseline === "middle") top = y - h / 2;
            else if (
              state.textBaseline === "bottom" ||
              state.textBaseline === "alphabetic"
            )
              top = y - h;

            const [r, g, b, a] = parseCssRgba(state.fillStyle);
            for (
              let py = Math.max(0, Math.floor(top));
              py < Math.min(bufState.height, Math.ceil(top + h));
              py++
            ) {
              for (
                let px = Math.max(0, Math.floor(left));
                px < Math.min(bufState.width, Math.ceil(left + w));
                px++
              ) {
                writePixel(bufState, px, py, r, g, b, a);
              }
            }
          },
        ),
        createPattern: vi.fn((img: HTMLCanvasElement) => {
          return { __mockPatternSource: img } as unknown as CanvasPattern;
        }),
        drawImage: vi.fn(
          (
            img: HTMLCanvasElement | HTMLImageElement,
            a1: number,
            a2: number,
            a3?: number,
            a4?: number,
            a5?: number,
            a6?: number,
            a7?: number,
            a8?: number,
          ) => {
            const dstState = ensureBuffer(this);
            if (dstState.width <= 0 || dstState.height <= 0) return;

            let srcBuf: CanvasBufferState | undefined;
            if (img instanceof HTMLCanvasElement) {
              srcBuf = ensureBuffer(img);
            } else {
              const srcUrl = img.src;
              const snap = srcUrl ? encodedSnapshots.get(srcUrl) : undefined;
              if (snap) {
                srcBuf = snap;
              } else {
                const iw = img.naturalWidth || img.width || 0;
                const ih = img.naturalHeight || img.height || 0;
                if (iw > 0 && ih > 0) {
                  const data = new Uint8ClampedArray(iw * ih * 4);
                  for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                    data[i + 3] = 255;
                  }
                  srcBuf = { width: iw, height: ih, data };
                }
              }
            }

            if (!srcBuf || srcBuf.width <= 0 || srcBuf.height <= 0) return;

            let sx = 0;
            let sy = 0;
            let sw = srcBuf.width;
            let sh = srcBuf.height;
            let dx = a1;
            let dy = a2;
            let dw = srcBuf.width;
            let dh = srcBuf.height;

            if (a7 !== undefined && a8 !== undefined) {
              sx = a1;
              sy = a2;
              sw = a3!;
              sh = a4!;
              dx = a5!;
              dy = a6!;
              dw = a7;
              dh = a8;
            } else if (a3 !== undefined && a4 !== undefined) {
              dx = a1;
              dy = a2;
              dw = a3;
              dh = a4;
            }

            if (sw <= 0 || sh <= 0 || dw === 0 || dh === 0) return;

            const inv = invertMatrix(state.matrix);
            if (!inv) return;

            // Compute transformed bounding box in dst canvas coords to skip empty scanning
            const corners = [
              applyMatrix(state.matrix, dx, dy),
              applyMatrix(state.matrix, dx + dw, dy),
              applyMatrix(state.matrix, dx + dw, dy + dh),
              applyMatrix(state.matrix, dx, dy + dh),
            ];
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            for (const c of corners) {
              if (c.x < minX) minX = c.x;
              if (c.y < minY) minY = c.y;
              if (c.x > maxX) maxX = c.x;
              if (c.y > maxY) maxY = c.y;
            }

            const startX = Math.max(0, Math.floor(minX));
            const startY = Math.max(0, Math.floor(minY));
            const endX = Math.min(dstState.width, Math.ceil(maxX));
            const endY = Math.min(dstState.height, Math.ceil(maxY));

            const scaleX = sw / dw;
            const scaleY = sh / dh;

            // For destination-in/destination-out we must inspect every pixel in the destination canvas
            // if a transform doesn't cover full canvas (Canvas/Transform always passes full-size mask or clears)
            const gco = state.globalCompositeOperation;
            const scanFullForMask = gco === "destination-in";
            const loopStartX = scanFullForMask ? 0 : startX;
            const loopStartY = scanFullForMask ? 0 : startY;
            const loopEndX = scanFullForMask ? dstState.width : endX;
            const loopEndY = scanFullForMask ? dstState.height : endY;

            // Make a snapshot copy if self-drawing
            const srcData =
              srcBuf === dstState
                ? new Uint8ClampedArray(srcBuf.data)
                : srcBuf.data;

            for (let py = loopStartY; py < loopEndY; py++) {
              for (let px = loopStartX; px < loopEndX; px++) {
                const local = applyMatrix(inv, px + 0.5, py + 0.5);
                const relX = local.x - dx;
                const relY = local.y - dy;

                const insideDstRect =
                  relX >= 0 && relX < dw && relY >= 0 && relY < dh;

                if (!insideDstRect) {
                  if (scanFullForMask) {
                    writePixel(dstState, px, py, 0, 0, 0, 0);
                  }
                  continue;
                }

                const srcX = Math.floor(sx + relX * scaleX);
                const srcY = Math.floor(sy + relY * scaleY);

                if (
                  srcX < 0 ||
                  srcY < 0 ||
                  srcX >= srcBuf.width ||
                  srcY >= srcBuf.height
                ) {
                  if (scanFullForMask) {
                    writePixel(dstState, px, py, 0, 0, 0, 0);
                  }
                  continue;
                }

                const sIdx = (srcY * srcBuf.width + srcX) * 4;
                writePixel(
                  dstState,
                  px,
                  py,
                  srcData[sIdx],
                  srcData[sIdx + 1],
                  srcData[sIdx + 2],
                  srcData[sIdx + 3],
                );
              }
            }
          },
        ),
        getImageData: vi.fn((x: number, y: number, rw: number, rh: number) => {
          const bufState = ensureBuffer(this);
          const cw = bufState.width;
          const ch = bufState.height;
          const out = new Uint8ClampedArray(rw * rh * 4);
          for (let row = 0; row < rh; row++) {
            const sy = y + row;
            if (sy < 0 || sy >= ch) continue;
            for (let col = 0; col < rw; col++) {
              const sx = x + col;
              if (sx < 0 || sx >= cw) continue;
              const srcIdx = (sy * cw + sx) * 4;
              const dstIdx = (row * rw + col) * 4;
              out[dstIdx] = bufState.data[srcIdx];
              out[dstIdx + 1] = bufState.data[srcIdx + 1];
              out[dstIdx + 2] = bufState.data[srcIdx + 2];
              out[dstIdx + 3] = bufState.data[srcIdx + 3];
            }
          }
          return {
            data: out,
            width: rw,
            height: rh,
            colorSpace: "srgb",
          } as ImageData;
        }),
        putImageData: vi.fn((imgData: ImageData, dx: number, dy: number) => {
          const bufState = ensureBuffer(this);
          const cw = bufState.width;
          const ch = bufState.height;
          for (let row = 0; row < imgData.height; row++) {
            const ty = dy + row;
            if (ty < 0 || ty >= ch) continue;
            for (let col = 0; col < imgData.width; col++) {
              const tx = dx + col;
              if (tx < 0 || tx >= cw) continue;
              const srcIdx = (row * imgData.width + col) * 4;
              const dstIdx = (ty * cw + tx) * 4;
              bufState.data[dstIdx] = imgData.data[srcIdx];
              bufState.data[dstIdx + 1] = imgData.data[srcIdx + 1];
              bufState.data[dstIdx + 2] = imgData.data[srcIdx + 2];
              bufState.data[dstIdx + 3] = imgData.data[srcIdx + 3];
            }
          }
        }),
      };

      void curX;
      void curY;

      const castCtx = ctxMock as unknown as CanvasRenderingContext2D;
      contexts.set(this, castCtx);
      return castCtx;
    });

  const toDataURLSpy = vi
    .spyOn(HTMLCanvasElement.prototype, "toDataURL")
    .mockImplementation(function (
      this: HTMLCanvasElement,
      type: string = "image/png",
      quality?: number,
    ) {
      const bufState = ensureBuffer(this);
      const id = ++snapshotCounter;
      const qTag = quality !== undefined ? `;q=${quality}` : "";
      const url = `data:${type};base64,fuderuMock-${id}-${bufState.width}x${bufState.height}${qTag}`;
      encodedSnapshots.set(url, {
        width: bufState.width,
        height: bufState.height,
        data: new Uint8ClampedArray(bufState.data),
      });
      return url;
    });

  const toBlobSpy = vi
    .spyOn(HTMLCanvasElement.prototype, "toBlob")
    .mockImplementation(function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
      type: string = "image/png",
      quality?: number,
    ) {
      const url = this.toDataURL(type, quality);
      callback(new Blob([url], { type }));
    });

  return {
    getBuffer(canvas: HTMLCanvasElement): Uint8ClampedArray {
      return ensureBuffer(canvas).data;
    },
    getPixel(
      canvas: HTMLCanvasElement,
      x: number,
      y: number,
    ): [number, number, number, number] {
      const buf = ensureBuffer(canvas);
      if (x < 0 || y < 0 || x >= buf.width || y >= buf.height) {
        return [0, 0, 0, 0];
      }
      const idx = (y * buf.width + x) * 4;
      return [
        buf.data[idx],
        buf.data[idx + 1],
        buf.data[idx + 2],
        buf.data[idx + 3],
      ];
    },
    countNonTransparentPixels(canvas: HTMLCanvasElement): number {
      const buf = ensureBuffer(canvas);
      let count = 0;
      for (let i = 3; i < buf.data.length; i += 4) {
        if (buf.data[i] > 0) count++;
      }
      return count;
    },
    encodedSnapshots,
    restore() {
      getContextSpy.mockRestore();
      toDataURLSpy.mockRestore();
      toBlobSpy.mockRestore();
      encodedSnapshots.clear();
    },
  };
}
