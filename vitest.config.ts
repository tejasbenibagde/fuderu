// vitest.config.ts

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "custom",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.*"],
    },
    environment: "jsdom",
  },
});
