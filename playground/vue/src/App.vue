<template>
  <div>
    <canvas ref="canvasRef" :width="width" :height="height" />

    <div class="controls">
      <label>
        Color:
        <input
          type="color"
          v-model="brushConfig.color"
          @input="setBrushColor"
        />
      </label>

      <label>
        Size:
        <input
          type="range"
          min="1"
          max="100"
          v-model.number="brushConfig.size"
          @input="setBrushSize"
        />
        <span>{{ brushConfig.size }}px</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import {useCanvas} from "../composables/useCanvas";

const { canvasRef, width, height, brushConfig, setBrushColor, setBrushSize } =
  useCanvas({
    width: 800,
    height: 600,
    brushConfig: {
      color: "#000000",
      size: 20,
    },
  });
</script>