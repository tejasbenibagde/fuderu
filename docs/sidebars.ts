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
        "guides/standalone-brush",
        "guides/image-brushes",
        "guides/modules",
      ],
    },
    {
      type: "category",
      label: "API Reference",
      items: ["api/canvas", "api/brush", "api/configuration", "api/modules"],
    },
  ],
};

export default sidebars;
