import {
  Canvas,
  DynamicShapeModule,
  DynamicTransparencyModule,
  SpreadModule,
} from "@fuderu";

const state = {
  width: 1920,
  height: 1080,
  activeTool: "brush", // "brush" | "eraser" | "bucket" | "rectangle" | "ellipse" | "line" | "text" | "eyedropper"
};

const $ = (id) => document.getElementById(id);

const canvasEl = $("canvas");
const overlayCanvas = $("overlayCanvas");
const status = $("status");
const documentLabel = $("documentLabel");
const cursorLabel = $("cursorLabel");
const layerList = $("layerList");
const layerCount = $("layerCount");
const activeToolName = $("activeToolName");

const controls = {
  color: $("colorPicker"),
  size: $("sizeSlider"),
  opacity: $("opacitySlider"),
  flow: $("flowSlider"),
  spacing: $("spacingSlider"),
  roundness: $("roundnessSlider"),
  smooth: $("smoothToggle"),
  spacingEnabled: $("spacingToggle"),
  pressure: $("pressureToggle"),
  eraser: $("eraserToggle"),
  rotationMode: $("rotationMode"),
  angle: $("angleSlider"),
  rotationJitter: $("rotationJitter"),
  sizeJitter: $("sizeJitter"),
  flowJitter: $("flowJitter"),
  spread: $("spreadSlider"),
};

const outputs = {
  size: $("sizeValue"),
  opacity: $("opacityValue"),
  flow: $("flowValue"),
  spacing: $("spacingValue"),
  roundness: $("roundnessValue"),
  angle: $("angleValue"),
  rotationJitter: $("rotationJitterValue"),
  sizeJitter: $("sizeJitterValue"),
  flowJitter: $("flowJitterValue"),
  spread: $("spreadValue"),
};

const dynamicShape = new DynamicShapeModule();
const dynamicTransparency = new DynamicTransparencyModule();
const spread = new SpreadModule();

const painter = new Canvas({
  canvas: canvasEl,
  document: { width: state.width, height: state.height },
  pressureSimulation: false,
  brush: {
    size: Number(controls.size.value),
    opacity: Number(controls.opacity.value),
    flow: Number(controls.flow.value),
    color: controls.color.value,
    spacing: Number(controls.spacing.value),
    roundness: Number(controls.roundness.value),
    rotation: { mode: controls.rotationMode.value },
  },
});

painter.brush.useModule(dynamicShape);
painter.brush.useModule(dynamicTransparency);
painter.brush.useModule(spread);

// Observable State & Event System (v1.4.0)
painter.on("change", (snapshot) => {
  const { history } = snapshot;
  const undoBtn = $("undoBtn");
  const redoBtn = $("redoBtn");
  if (undoBtn) undoBtn.disabled = !history.canUndo;
  if (redoBtn) redoBtn.disabled = !history.canRedo;
});

painter.on("stroke:end", ({ bounds, points }) => {
  status.textContent = `Stroke ended (${points.length} pts, ${Math.round(bounds.width)}x${Math.round(bounds.height)}px)`;
  refreshLayerPreviews();
});

function getActiveLayer() {
  return painter.getActiveLayer();
}

function syncOverlayCanvasSize() {
  if (!overlayCanvas) return;
  overlayCanvas.width = state.width;
  overlayCanvas.height = state.height;
  overlayCanvas.style.aspectRatio = `${state.width} / ${state.height}`;
}

function drawLayerPreview(layer, preview) {
  const ctx = preview.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, preview.width, preview.height);

  const scale = Math.min(
    preview.width / layer.canvas.width,
    preview.height / layer.canvas.height,
  );
  const width = layer.canvas.width * scale;
  const height = layer.canvas.height * scale;
  const x = (preview.width - width) / 2;
  const y = (preview.height - height) / 2;

  ctx.drawImage(layer.canvas, x, y, width, height);
}

function blendLabel(mode) {
  if (mode === "source-over") return "Normal";
  return mode
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const BLEND_MODES = [
  "source-over",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "difference",
  "exclusion",
];

// ───────────────────────────────────────────────────────────
// Layer list rendering
// ───────────────────────────────────────────────────────────

function buildLayerRow(layer, index, totalLayers, activeLayerId) {
  const row = document.createElement("div");
  row.className = `layer-card${layer.id === activeLayerId ? " active" : ""}`;
  row.dataset.layerId = layer.id;

  const selectLayer = () => {
    if (layer.id === activeLayerId) return;
    painter.setActiveLayer(layer.id);
    renderLayerList();
    status.textContent = `Active: ${layer.name}`;
  };

  row.addEventListener("click", selectLayer);

  const preview = document.createElement("canvas");
  preview.className = "layer-preview";
  preview.width = 96;
  preview.height = 64;
  drawLayerPreview(layer, preview);

  const body = document.createElement("div");
  body.className = "layer-card-body";

  // ── Header: name input + visibility toggle ──────────────
  const header = document.createElement("div");
  header.className = "layer-card-header";

  const name = document.createElement("input");
  name.className = "layer-name";
  name.value = layer.name;
  name.spellcheck = false;
  name.addEventListener("pointerdown", (e) => e.stopPropagation());
  name.addEventListener("click", (e) => e.stopPropagation());
  name.addEventListener("change", () => {
    painter.updateLayer(layer.id, { name: name.value || "Layer" });
    status.textContent = "Renamed";
  });
  name.addEventListener("keydown", (e) => {
    if (e.key === "Enter") name.blur();
  });

  const visibility = document.createElement("button");
  visibility.type = "button";
  visibility.className = "layer-toggle";
  visibility.setAttribute(
    "aria-label",
    layer.visible ? "Hide layer" : "Show layer",
  );
  visibility.innerHTML = layer.visible ? EYE_OPEN_ICON : EYE_CLOSED_ICON;
  visibility.addEventListener("pointerdown", (e) => e.stopPropagation());
  visibility.addEventListener("click", (e) => {
    e.stopPropagation();
    const nextVisible = !layer.visible;
    painter.updateLayer(layer.id, { visible: nextVisible });
    visibility.innerHTML = nextVisible ? EYE_OPEN_ICON : EYE_CLOSED_ICON;
    visibility.setAttribute(
      "aria-label",
      nextVisible ? "Hide layer" : "Show layer",
    );
    row.classList.toggle("dimmed", !nextVisible);
    status.textContent = nextVisible ? "Layer shown" : "Layer hidden";
  });

  header.append(name, visibility);

  // ── Locks row: Alpha Lock + Layer Lock (v1.3.0 / v1.4.0) ────────
  const locks = document.createElement("div");
  locks.className = "layer-card-locks";

  const alphaLockBtn = document.createElement("button");
  alphaLockBtn.type = "button";
  alphaLockBtn.className = `lock-toggle-btn${layer.alphaLock ? " active" : ""}`;
  alphaLockBtn.innerHTML = `<span>α</span> Alpha Lock`;
  alphaLockBtn.title = "Restricts edits to existing opaque pixels";
  alphaLockBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
  alphaLockBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const nextAlpha = !layer.alphaLock;
    painter.updateLayer(layer.id, { alphaLock: nextAlpha });
    alphaLockBtn.classList.toggle("active", nextAlpha);
    status.textContent = nextAlpha ? "Alpha Lock ON" : "Alpha Lock OFF";
  });

  const layerLockBtn = document.createElement("button");
  layerLockBtn.type = "button";
  layerLockBtn.className = `lock-toggle-btn${layer.locked ? " active" : ""}`;
  layerLockBtn.innerHTML = `<span>🔒</span> Lock`;
  layerLockBtn.title = "Locks layer from drawing or deletion";
  layerLockBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
  layerLockBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const nextLock = !layer.locked;
    painter.updateLayer(layer.id, { locked: nextLock });
    layerLockBtn.classList.toggle("active", nextLock);
    status.textContent = nextLock ? "Layer Locked" : "Layer Unlocked";
  });

  locks.append(alphaLockBtn, layerLockBtn);

  // ── Meta row: opacity slider + blend mode select ────────
  const meta = document.createElement("div");
  meta.className = "layer-meta";

  const opacityLabel = document.createElement("label");
  opacityLabel.className = "layer-opacity";

  const opacityTop = document.createElement("div");
  opacityTop.className = "layer-opacity-top";
  const opacityName = document.createElement("span");
  opacityName.textContent = "Opacity";
  const opacityValue = document.createElement("output");
  opacityValue.textContent = `${Math.round(layer.opacity * 100)}%`;
  opacityTop.append(opacityName, opacityValue);

  const opacity = document.createElement("input");
  opacity.type = "range";
  opacity.min = "0";
  opacity.max = "1";
  opacity.step = "0.01";
  opacity.value = String(layer.opacity);
  opacity.addEventListener("pointerdown", (e) => e.stopPropagation());
  opacity.addEventListener("click", (e) => e.stopPropagation());
  opacity.addEventListener("input", () => {
    const nextOpacity = Number(opacity.value);
    painter.updateLayer(layer.id, { opacity: nextOpacity });
    opacityValue.textContent = `${Math.round(nextOpacity * 100)}%`;
    status.textContent = `${layer.name}: ${opacityValue.textContent}`;
  });

  opacityLabel.append(opacityTop, opacity);

  const blendWrap = document.createElement("label");
  blendWrap.className = "layer-blend-wrap";
  const blendCaption = document.createElement("span");
  blendCaption.textContent = "Blend";
  const blendMode = document.createElement("select");
  blendMode.className = "layer-blend";
  BLEND_MODES.forEach((mode) => {
    const option = document.createElement("option");
    option.value = mode;
    option.textContent = blendLabel(mode);
    blendMode.append(option);
  });
  blendMode.value = layer.blendMode;
  blendMode.addEventListener("pointerdown", (e) => e.stopPropagation());
  blendMode.addEventListener("click", (e) => e.stopPropagation());
  blendMode.addEventListener("change", (e) => {
    e.stopPropagation();
    painter.updateLayer(layer.id, { blendMode: blendMode.value });
    status.textContent = `${layer.name}: ${blendLabel(blendMode.value)}`;
  });
  blendWrap.append(blendCaption, blendMode);

  meta.append(opacityLabel, blendWrap);

  // ── Footer: reorder / duplicate / delete ─────────────────
  const moveControls = document.createElement("div");
  moveControls.className = "layer-move";

  const up = document.createElement("button");
  up.type = "button";
  up.className = "icon-btn";
  up.innerHTML = CHEVRON_UP_ICON;
  up.title = "Move up";
  up.disabled = index === totalLayers - 1;
  up.addEventListener("pointerdown", (e) => e.stopPropagation());
  up.addEventListener("click", (e) => {
    e.stopPropagation();
    painter.moveLayer(layer.id, index + 1);
    renderLayerList();
    status.textContent = "Layer moved";
  });

  const down = document.createElement("button");
  down.type = "button";
  down.className = "icon-btn";
  down.innerHTML = CHEVRON_DOWN_ICON;
  down.title = "Move down";
  down.disabled = index === 0;
  down.addEventListener("pointerdown", (e) => e.stopPropagation());
  down.addEventListener("click", (e) => {
    e.stopPropagation();
    painter.moveLayer(layer.id, index - 1);
    renderLayerList();
    status.textContent = "Layer moved";
  });

  const duplicate = document.createElement("button");
  duplicate.type = "button";
  duplicate.className = "icon-btn";
  duplicate.innerHTML = DUPLICATE_ICON;
  duplicate.title = "Duplicate layer";
  duplicate.addEventListener("pointerdown", (e) => e.stopPropagation());
  duplicate.addEventListener("click", (e) => {
    e.stopPropagation();
    const copiedLayer = painter.duplicateLayer(layer.id);
    renderLayerList();
    status.textContent = `Duplicated: ${copiedLayer.name}`;
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-btn danger";
  remove.innerHTML = TRASH_ICON;
  remove.title = "Delete layer";
  remove.disabled = totalLayers === 1 || layer.locked;
  remove.addEventListener("pointerdown", (e) => e.stopPropagation());
  remove.addEventListener("click", (e) => {
    e.stopPropagation();
    if (layer.locked) {
      status.textContent = "Cannot delete locked layer";
      return;
    }
    painter.deleteLayer(layer.id);
    renderLayerList();
    status.textContent = "Layer deleted";
  });

  moveControls.append(up, down, duplicate, remove);

  preview.addEventListener("click", selectLayer);

  body.append(header, locks, meta, moveControls);
  row.append(preview, body);

  if (!layer.visible) row.classList.add("dimmed");

  return row;
}

function renderLayerList() {
  const layers = [...painter.getLayers()];
  const activeLayer = getActiveLayer();

  layerList.replaceChildren();
  layerCount.textContent = `${layers.length} ${layers.length === 1 ? "layer" : "layers"}`;

  layers
    .map((layer, index) => ({ layer, index }))
    .reverse()
    .forEach(({ layer, index }) => {
      layerList.append(
        buildLayerRow(layer, index, layers.length, activeLayer.id),
      );
    });
}

function syncLayers() {
  renderLayerList();
}

function setCanvasAspect(width, height) {
  canvasEl.style.aspectRatio = `${width} / ${height}`;
  documentLabel.textContent = `${width} × ${height}`;
  syncOverlayCanvasSize();
}

function degreesToTurns(value) {
  return Number(value) / 360;
}

function degreesToRadians(value) {
  return degreesToTurns(value) * Math.PI * 2;
}

function syncLabels() {
  outputs.size.textContent = `${controls.size.value}px`;
  outputs.opacity.textContent = `${Math.round(Number(controls.opacity.value) * 100)}%`;
  outputs.flow.textContent = `${Math.round(Number(controls.flow.value) * 100)}%`;
  outputs.spacing.textContent = Number(controls.spacing.value).toFixed(2);
  outputs.roundness.textContent = Number(controls.roundness.value).toFixed(2);
  outputs.angle.textContent = `${controls.angle.value}°`;
  outputs.rotationJitter.textContent = `${controls.rotationJitter.value}°`;
  outputs.sizeJitter.textContent = Number(controls.sizeJitter.value).toFixed(2);
  outputs.flowJitter.textContent = Number(controls.flowJitter.value).toFixed(2);
  outputs.spread.textContent = Number(controls.spread.value).toFixed(2);

  if ($("toleranceValue"))
    $("toleranceValue").textContent = $("toleranceSlider").value;
  if ($("strokeWidthValue"))
    $("strokeWidthValue").textContent = `${$("strokeWidthSlider").value}px`;
  if ($("cornerRadiusValue"))
    $("cornerRadiusValue").textContent = `${$("cornerRadiusSlider").value}px`;
  if ($("fontSizeValue"))
    $("fontSizeValue").textContent = `${$("fontSizeSlider").value}px`;
}

function syncBrush() {
  painter.loadConfig({
    color: controls.color.value,
    size: Number(controls.size.value),
    opacity: Number(controls.opacity.value),
    flow: Number(controls.flow.value),
    spacing: Number(controls.spacing.value),
    roundness: Number(controls.roundness.value),
    angle: degreesToTurns(controls.angle.value),
    rotation: {
      mode: controls.rotationMode.value,
      offset: degreesToRadians(controls.angle.value),
      jitter: degreesToRadians(controls.rotationJitter.value),
      smoothing: 0.15,
    },
  });

  painter.setSmooth(controls.smooth.checked);
  painter.setSpacing(controls.spacingEnabled.checked);
  painter.pressureSimulation = controls.pressure.checked;
  if (controls.pressure.checked) {
    painter.mousePressure.open();
  } else {
    painter.mousePressure.close();
  }
  painter.setEraser(state.activeTool === "eraser" || controls.eraser.checked);

  dynamicShape.bindConfig({
    sizeJitter: Number(controls.sizeJitter.value),
    angleJitter: 0,
    roundJitter: 0,
    minDiameter: 0.25,
    minRoundness: 0.35,
    sizeJitterTrigger: "none",
    angleJitterTrigger: "none",
    roundJitterTrigger: "none",
  });

  dynamicTransparency.bindConfig({
    opacityJitter: 0,
    flowJitter: Number(controls.flowJitter.value),
    minOpacityJitter: 0,
    minFlowJitter: 0,
    opacityJitterTrigger: "none",
    flowJitterTrigger: "none",
  });

  spread.bindConfig({
    spreadRange: Number(controls.spread.value),
    spreadTrigger: "none",
    count: Number(controls.spread.value) > 0 ? 3 : 1,
    countJitter: 0,
    countJitterTrigger: "none",
  });
}

function setTool(tool) {
  state.activeTool = tool;

  document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tool === tool);
  });

  const toolLabels = {
    brush: "Brush",
    eraser: "Eraser",
    bucket: "Bucket Fill",
    rectangle: "Rectangle",
    ellipse: "Ellipse",
    line: "Line",
    text: "Text",
    eyedropper: "Eyedropper",
  };

  if (activeToolName) activeToolName.textContent = toolLabels[tool] || tool;

  $("brushOptions").style.display =
    tool === "brush" || tool === "eraser" ? "block" : "none";
  $("bucketOptions").style.display = tool === "bucket" ? "block" : "none";
  $("shapeOptions").style.display =
    tool === "rectangle" || tool === "ellipse" || tool === "line"
      ? "block"
      : "none";
  $("cornerRadiusField").style.display = tool === "rectangle" ? "grid" : "none";
  $("textOptions").style.display = tool === "text" ? "block" : "none";
  $("eyedropperOptions").style.display =
    tool === "eyedropper" ? "block" : "none";

  if (controls.eraser) {
    controls.eraser.checked = tool === "eraser";
  }

  syncBrush();
  status.textContent = `Tool: ${toolLabels[tool] || tool}`;
}

document.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    setTool(btn.dataset.tool);
  });
});

function getCanvasCoords(event) {
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvasEl.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvasEl.height / rect.height : 1;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

// ───────────────────────────────────────────────────────────
// Custom Tools Pointer Handling (Capture Phase)
// ───────────────────────────────────────────────────────────

let isDrawingShape = false;
let shapeStartCoords = null;

function clearOverlay() {
  if (!overlayCanvas) return;
  const ctx = overlayCanvas.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

function drawOverlayPreview(endCoords) {
  if (!overlayCanvas || !shapeStartCoords) return;
  const ctx = overlayCanvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  ctx.save();
  ctx.strokeStyle = controls.color.value;
  ctx.fillStyle = controls.color.value + "44";
  ctx.lineWidth = Number($("strokeWidthSlider").value);
  ctx.setLineDash([6, 6]);

  const x1 = shapeStartCoords.x;
  const y1 = shapeStartCoords.y;
  const x2 = endCoords.x;
  const y2 = endCoords.y;

  if (state.activeTool === "rectangle") {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    ctx.strokeRect(minX, minY, w, h);
    if ($("shapeFillToggle").checked) ctx.fillRect(minX, minY, w, h);
  } else if (state.activeTool === "ellipse") {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    const cx = minX + w / 2;
    const cy = minY + h / 2;
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      Math.max(0.1, w / 2),
      Math.max(0.1, h / 2),
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    if ($("shapeFillToggle").checked) ctx.fill();
  } else if (state.activeTool === "line") {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

canvasEl.addEventListener(
  "pointerdown",
  (e) => {
    const activeLayer = getActiveLayer();

    if (activeLayer.locked) {
      status.textContent = "Layer is locked!";
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }

    // Brush and Eraser use Fuderu's native drawing engine
    if (state.activeTool === "brush" || state.activeTool === "eraser") {
      return;
    }

    // Intercept all other custom tools
    e.stopImmediatePropagation();
    e.preventDefault();

    const coords = getCanvasCoords(e);

    if (state.activeTool === "bucket") {
      try {
        const tolerance = Number($("toleranceSlider").value);
        painter.floodFill(
          Math.round(coords.x),
          Math.round(coords.y),
          controls.color.value,
          tolerance,
        );
        refreshLayerPreviews();
        status.textContent = "Bucket fill completed";
      } catch (err) {
        console.error(err);
        status.textContent =
          err instanceof Error ? err.message : "Bucket fill failed";
      }
    } else if (state.activeTool === "eyedropper") {
      try {
        const sampled = painter.getColorAt(
          Math.round(coords.x),
          Math.round(coords.y),
          "composite",
        );
        controls.color.value = sampled.hex;
        if ($("sampledColorSwatch"))
          $("sampledColorSwatch").style.background = sampled.hex;
        if ($("sampledColorLabel"))
          $("sampledColorLabel").textContent =
            `${sampled.hex} (a: ${sampled.a})`;
        syncBrush();
        status.textContent = `Sampled color: ${sampled.hex}`;
      } catch (err) {
        console.error(err);
        status.textContent = "Color sampling failed";
      }
    } else if (state.activeTool === "text") {
      try {
        const text = $("textInput").value || "Text";
        const fontSize = Number($("fontSizeSlider").value);
        const fontFamily = $("fontFamilySelect").value;
        const isBold = $("textBoldToggle").checked;
        painter.drawText(text, coords.x, coords.y, {
          fontSize,
          fontFamily,
          fontWeight: isBold ? "bold" : "normal",
          color: controls.color.value,
        });
        refreshLayerPreviews();
        status.textContent = "Text drawn";
      } catch (err) {
        console.error(err);
        status.textContent = err instanceof Error ? err.message : "Text failed";
      }
    } else if (
      state.activeTool === "rectangle" ||
      state.activeTool === "ellipse" ||
      state.activeTool === "line"
    ) {
      isDrawingShape = true;
      shapeStartCoords = coords;

      const onPointerMove = (moveEv) => {
        if (!isDrawingShape) return;
        const currentCoords = getCanvasCoords(moveEv);
        drawOverlayPreview(currentCoords);
      };

      const onPointerUp = (upEv) => {
        if (!isDrawingShape) return;
        isDrawingShape = false;
        clearOverlay();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);

        const endCoords = getCanvasCoords(upEv);

        try {
          const fill = $("shapeFillToggle").checked;
          const stroke = $("shapeStrokeToggle").checked;
          const strokeWidth = Number($("strokeWidthSlider").value);

          if (state.activeTool === "rectangle") {
            const minX = Math.min(shapeStartCoords.x, endCoords.x);
            const minY = Math.min(shapeStartCoords.y, endCoords.y);
            const w = Math.abs(endCoords.x - shapeStartCoords.x);
            const h = Math.abs(endCoords.y - shapeStartCoords.y);
            const radius = Number($("cornerRadiusSlider").value);
            if (w > 1 && h > 1) {
              painter.drawRectangle({
                x: minX,
                y: minY,
                width: w,
                height: h,
                fillColor: controls.color.value,
                strokeColor: controls.color.value,
                strokeWidth,
                rx: radius,
                ry: radius,
                fill,
                stroke,
              });
              status.textContent = "Rectangle drawn";
            }
          } else if (state.activeTool === "ellipse") {
            const minX = Math.min(shapeStartCoords.x, endCoords.x);
            const minY = Math.min(shapeStartCoords.y, endCoords.y);
            const w = Math.abs(endCoords.x - shapeStartCoords.x);
            const h = Math.abs(endCoords.y - shapeStartCoords.y);
            if (w > 1 && h > 1) {
              painter.drawEllipse({
                x: minX + w / 2,
                y: minY + h / 2,
                radiusX: w / 2,
                radiusY: h / 2,
                fillColor: controls.color.value,
                strokeColor: controls.color.value,
                strokeWidth,
                fill,
                stroke,
              });
              status.textContent = "Ellipse drawn";
            }
          } else if (state.activeTool === "line") {
            painter.drawLine({
              x1: shapeStartCoords.x,
              y1: shapeStartCoords.y,
              x2: endCoords.x,
              y2: endCoords.y,
              strokeColor: controls.color.value,
              strokeWidth,
              lineCap: "round",
            });
            status.textContent = "Line drawn";
          }
          refreshLayerPreviews();
        } catch (err) {
          console.error(err);
          status.textContent =
            err instanceof Error ? err.message : "Shape drawing failed";
        }
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }
  },
  true,
);

// Direct Layer Actions (v1.3.0 / v1.4.0)
if ($("fillActiveLayerBtn")) {
  $("fillActiveLayerBtn").addEventListener("click", () => {
    try {
      painter.fillActiveLayer(controls.color.value);
      refreshLayerPreviews();
      status.textContent = "Layer filled";
    } catch (err) {
      console.error(err);
      status.textContent =
        err instanceof Error ? err.message : "Fill layer failed";
    }
  });
}

function applyDocumentSize(width, height) {
  if (width <= 0 || height <= 0) return;

  state.width = width;
  state.height = height;
  painter.setDocumentSize(width, height);
  setCanvasAspect(width, height);
  syncLayers();
  $("docWidth").value = String(width);
  $("docHeight").value = String(height);
  status.textContent = "Document resized";
}

function updateCursorLabel(event) {
  const coords = getCanvasCoords(event);
  cursorLabel.textContent = `${Math.round(coords.x)}, ${Math.round(coords.y)} · p ${painter.lastPressure.toFixed(2)}`;
}

Object.values(controls).forEach((control) => {
  if (control) {
    control.addEventListener("input", () => {
      syncBrush();
      syncLabels();
    });
  }
});

[
  "toleranceSlider",
  "strokeWidthSlider",
  "cornerRadiusSlider",
  "fontSizeSlider",
  "textInput",
  "fontFamilySelect",
  "shapeFillToggle",
  "shapeStrokeToggle",
  "textBoldToggle",
].forEach((id) => {
  const el = $(id);
  if (el) {
    el.addEventListener("input", syncLabels);
    el.addEventListener("change", syncLabels);
  }
});

$("clearBtn").addEventListener("click", () => {
  try {
    painter.clearActiveLayer();
    refreshLayerPreviews();
    status.textContent = "Active layer cleared";
  } catch (err) {
    console.error(err);
    status.textContent = err instanceof Error ? err.message : "Clear failed";
  }
});

$("undoBtn").addEventListener("click", () => {
  painter.undo();
  renderLayerList();
  status.textContent = "Undo";
});

$("redoBtn").addEventListener("click", () => {
  painter.redo();
  renderLayerList();
  status.textContent = "Redo";
});

$("applySizeBtn").addEventListener("click", () => {
  applyDocumentSize(Number($("docWidth").value), Number($("docHeight").value));
});

$("addLayerBtn").addEventListener("click", () => {
  const layer = painter.createLayer(`Layer ${painter.getLayers().length + 1}`);
  syncLayers();
  status.textContent = `Active: ${layer.name}`;
});

document.querySelectorAll("[data-size]").forEach((button) => {
  button.addEventListener("click", () => {
    const [width, height] = button.dataset.size.split("x").map(Number);
    applyDocumentSize(width, height);
  });
});

// ── Persistence API (v1.3.0) ───────────────────────────────────
$("exportDocBtn").addEventListener("click", async () => {
  try {
    status.textContent = "Exporting...";
    const doc = await painter.exportDocument();
    const jsonStr = JSON.stringify(doc, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuderu-artwork-${doc.width}x${doc.height}.json`;
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = "Document exported";
  } catch (err) {
    console.error(err);
    status.textContent = "Export failed";
  }
});

$("importDocBtn").addEventListener("click", () => {
  $("docFileInput").click();
});

$("docFileInput").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    status.textContent = "Importing...";
    const text = await file.text();
    const doc = JSON.parse(text);
    await painter.importDocument(doc);
    state.width = doc.width;
    state.height = doc.height;
    setCanvasAspect(doc.width, doc.height);
    $("docWidth").value = String(doc.width);
    $("docHeight").value = String(doc.height);
    syncLayers();
    status.textContent = "Document imported";
  } catch (err) {
    console.error(err);
    status.textContent = "Import failed";
  } finally {
    e.target.value = "";
  }
});

$("exportPngBtn").addEventListener("click", async () => {
  try {
    status.textContent = "Exporting PNG...";
    const pngUrl = await painter.exportPNG({ includeBackground: true });
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "fuderu-artwork.png";
    a.click();
    status.textContent = "PNG exported";
  } catch (err) {
    console.error(err);
    status.textContent = "PNG export failed";
  }
});

$("saveLocalBtn").addEventListener("click", async () => {
  try {
    status.textContent = "Saving local...";
    const doc = await painter.exportDocument();
    localStorage.setItem("fuderu_playground_doc", JSON.stringify(doc));
    status.textContent = "Saved to localStorage";
  } catch (err) {
    console.error(err);
    status.textContent = "Save failed";
  }
});

$("loadLocalBtn").addEventListener("click", async () => {
  try {
    const raw = localStorage.getItem("fuderu_playground_doc");
    if (!raw) {
      status.textContent = "No saved local doc";
      return;
    }
    status.textContent = "Loading local...";
    const doc = JSON.parse(raw);
    await painter.importDocument(doc);
    state.width = doc.width;
    state.height = doc.height;
    setCanvasAspect(doc.width, doc.height);
    $("docWidth").value = String(doc.width);
    $("docHeight").value = String(doc.height);
    syncLayers();
    status.textContent = "Loaded from localStorage";
  } catch (err) {
    console.error(err);
    status.textContent = "Load failed";
  }
});

$("imageInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    status.textContent = "Loading image";
    await painter.loadImage(URL.createObjectURL(file));
    status.textContent = "Image brush";
  } catch (error) {
    console.error(error);
    status.textContent = "Image failed";
  }
});

function refreshLayerPreviews() {
  const cards = layerList.querySelectorAll(".layer-card");
  cards.forEach((card) => {
    const layerId = card.dataset.layerId;
    const layer = painter.getLayers().find((l) => l.id === layerId);
    if (!layer) return;
    const preview = card.querySelector(".layer-preview");
    if (preview) drawLayerPreview(layer, preview);
  });
}

$("removeImageBtn").addEventListener("click", () => {
  painter.brush.removeImage();
  status.textContent = "Image removed";
});

canvasEl.addEventListener("pointermove", updateCursorLabel);
window.addEventListener("pointerup", () => {
  refreshLayerPreviews();
});
window.addEventListener("pointercancel", () => {
  refreshLayerPreviews();
});
canvasEl.addEventListener("pointerleave", () => {
  cursorLabel.textContent = "—";
});

window.addEventListener("keydown", (event) => {
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement
  ) {
    return;
  }
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "z") {
    painter.undo();
    renderLayerList();
  } else if ((event.ctrlKey || event.metaKey) && key === "y") {
    painter.redo();
    renderLayerList();
  } else if (key === "b") {
    setTool("brush");
  } else if (key === "e") {
    setTool("eraser");
  } else if (key === "f") {
    setTool("bucket");
  } else if (key === "r") {
    setTool("rectangle");
  } else if (key === "c") {
    setTool("ellipse");
  } else if (key === "l") {
    setTool("line");
  } else if (key === "t") {
    setTool("text");
  } else if (key === "i") {
    setTool("eyedropper");
  }
});

// Inline icons
const EYE_OPEN_ICON = `<svg viewBox="0 0 20 20" fill="none"><path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="10" cy="10" r="2.4" stroke="currentColor" stroke-width="1.4"/></svg>`;
const EYE_CLOSED_ICON = `<svg viewBox="0 0 20 20" fill="none"><path d="M2.5 2.5l15 15M8.3 8.4a2.4 2.4 0 0 0 3.3 3.3M5.6 5.7C3.4 7 1.5 10 1.5 10s3 6 8.5 6c1.5 0 2.8-.4 3.9-1M16 14.3c1.6-1.4 2.5-3.5 2.5-4.3 0 0-1.3-2.6-3.9-4.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHEVRON_UP_ICON = `<svg viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHEVRON_DOWN_ICON = `<svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const DUPLICATE_ICON = `<svg viewBox="0 0 16 16" fill="none"><rect x="5.5" y="5.5" width="8" height="8" rx="1.3" stroke="currentColor" stroke-width="1.4"/><path d="M3 10.5V3.8A1.3 1.3 0 0 1 4.3 2.5h6.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
const TRASH_ICON = `<svg viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M6.3 4.5V3.3A1 1 0 0 1 7.3 2.3h1.4a1 1 0 0 1 1 1V4.5M4.5 4.5l.6 8.2a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

setCanvasAspect(state.width, state.height);
syncBrush();
syncLabels();
syncLayers();
setTool("brush");
