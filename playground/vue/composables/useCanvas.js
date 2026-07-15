// composables/useCanvas.js
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Canvas } from "fuderu";

export function useCanvas(options = {}) {
  const canvasRef = ref(null);
  const painter = ref(null);

  const width = ref(options.width ?? 800);
  const height = ref(options.height ?? 600);
  const brushConfig = ref(options.brushConfig ?? {});

  const initialize = () => {
    if (!canvasRef.value) return;

    painter.value = new Canvas({
      canvas: canvasRef.value,
      document: { width: width.value, height: height.value },
      brush: brushConfig.value,
    });
  };

  const reset = () => {
    if (painter.value) {
      painter.value.destroy();
      painter.value = null;
      initialize();
    }
  };

  onMounted(initialize);
  onBeforeUnmount(() => {
    if (painter.value) {
      painter.value.destroy();
      painter.value = null;
    }
  });

  // Expose brush control methods
  const setBrushColor = (color) => {
    brushConfig.value.color = color;
    if (painter.value) {
      painter.value.brush.config.color = color;
    }
  };

  const setBrushSize = (size) => {
    brushConfig.value.size = size;
    if (painter.value) {
      painter.value.brush.config.size = size;
    }
  };

  return {
    canvasRef,
    painter,
    width,
    height,
    brushConfig,
    reset,
    setBrushColor,
    setBrushSize,
  };
}
