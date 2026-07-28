import {
  Canvas,
  DynamicShapeModule,
  DynamicTransparencyModule,
  SpreadModule,
} from "@fuderu";

const state = {
  width: 1920,
  height: 1080,
  eraser: false,
};

const $ = (id) => document.getElementById(id);

const canvasEl = $("canvas");
const status = $("status");
const documentLabel = $("documentLabel");
const cursorLabel = $("cursorLabel");
const layerList = $("layerList");
const layerCount = $("layerCount");

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
});

function getActiveLayer() {
  return painter.getActiveLayer();
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
//
// IMPORTANT: this list is rebuilt only when layers are added,
// removed, reordered, or the active layer changes — never on
// every keystroke/drag of an interactive control inside a row.
// Each row's own controls update via small targeted handlers,
// not via a full replaceChildren(). This is what prevents the
// "select/name closes immediately" bug: the DOM node the user
// is actively interacting with is never destroyed mid-interaction.
// ───────────────────────────────────────────────────────────

function buildLayerRow(layer, index, totalLayers, activeLayerId) {
  const row = document.createElement("div");
  row.className = `layer-card${layer.id === activeLayerId ? " active" : ""}`;
  row.dataset.layerId = layer.id;

  // Selecting a layer happens by clicking the row background,
  // the preview thumbnail, or the drag handle — never by clicking
  // through an interactive control. Each interactive control below
  // stops propagation on both pointerdown and click so the click
  // never reaches the row, regardless of browser quirks around
  // native <select> / <input> click timing.
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
    // No full re-render needed — the input already shows the
    // value the user typed. Only the status line updates.
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
  remove.disabled = totalLayers === 1;
  remove.addEventListener("pointerdown", (e) => e.stopPropagation());
  remove.addEventListener("click", (e) => {
    e.stopPropagation();
    painter.deleteLayer(layer.id);
    renderLayerList();
    status.textContent = "Layer deleted";
  });

  moveControls.append(up, down, duplicate, remove);

  preview.addEventListener("click", selectLayer);

  body.append(header, meta, moveControls);
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
  painter.setEraser(controls.eraser.checked);

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

  status.textContent = controls.eraser.checked ? "Eraser" : "Brush";
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
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvasEl.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvasEl.height / rect.height : 1;
  const x = Math.round((event.clientX - rect.left) * scaleX);
  const y = Math.round((event.clientY - rect.top) * scaleY);
  cursorLabel.textContent = `${x}, ${y} · p ${painter.lastPressure.toFixed(2)}`;
}

Object.values(controls).forEach((control) => {
  control.addEventListener("input", () => {
    syncBrush();
    syncLabels();
  });
});

$("clearBtn").addEventListener("click", () => {
  painter.clear();
  status.textContent = "Layer cleared";
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
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "z") {
    painter.undo();
    renderLayerList();
  }
  if ((event.ctrlKey || event.metaKey) && key === "y") {
    painter.redo();
    renderLayerList();
  }
});

// ── Inline icon set (stroke-based, currentColor) ────────────
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
