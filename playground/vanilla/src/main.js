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

function setCanvasAspect(width, height) {
  canvasEl.style.aspectRatio = `${width} / ${height}`;
  documentLabel.textContent = `${width} x ${height}`;
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
  outputs.angle.textContent = `${controls.angle.value}deg`;
  outputs.rotationJitter.textContent = `${controls.rotationJitter.value}deg`;
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
  cursorLabel.textContent = `x ${x}, y ${y}, pressure ${painter.lastPressure.toFixed(2)}`;
}

Object.values(controls).forEach((control) => {
  control.addEventListener("input", () => {
    syncBrush();
    syncLabels();
  });
});

$("clearBtn").addEventListener("click", () => {
  painter.clear();
  status.textContent = "Cleared";
});

$("undoBtn").addEventListener("click", () => {
  painter.undo();
  status.textContent = "Undo";
});

$("redoBtn").addEventListener("click", () => {
  painter.redo();
  status.textContent = "Redo";
});

$("applySizeBtn").addEventListener("click", () => {
  applyDocumentSize(Number($("docWidth").value), Number($("docHeight").value));
});

document.querySelectorAll("[data-size]").forEach((button) => {
  button.addEventListener("click", () => {
    const [width, height] = button.dataset.size.split("x").map(Number);
    applyDocumentSize(width, height);
  });
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

$("removeImageBtn").addEventListener("click", () => {
  painter.brush.removeImage();
  status.textContent = "Image removed";
});

canvasEl.addEventListener("pointermove", updateCursorLabel);
canvasEl.addEventListener("pointerleave", () => {
  cursorLabel.textContent = "x 0, y 0";
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "z") painter.undo();
  if ((event.ctrlKey || event.metaKey) && key === "y") painter.redo();
});

setCanvasAspect(state.width, state.height);
syncBrush();
syncLabels();
