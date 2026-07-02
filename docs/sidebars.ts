import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting Started",
      items: ["getting-started/installation", "getting-started/quick-start"],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/canvas-wrapper",
        "guides/image-brushes",
        "guides/integration-react",
        "guides/integration-svelte",
        "guides/integration-vue",
        "guides/modules-advanced",
        "guides/modules",
        "guides/performance",
        "guides/standalone-brush",
      ],
    },
    {
      type: "category",
      label: "API Reference",
      items: [
        "api/canvas",
        "api/brush",
        "api/configuration",
        "api/modules",
        "api/layer-manager",
        "api/layer",
        "api/layers",
      ],
    },
  ],
};

export default sidebars;
