import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "🚀 Getting Started",
      collapsed: false,
      items: [
        "getting-started/installation",
        "getting-started/quick-start",
        "getting-started/mental-model",
      ],
    },
    {
      type: "category",
      label: "🎨 Core Drawing & Layers",
      collapsed: false,
      items: [
        "guides/basic-drawing",
        "guides/layer-system",
        "guides/history-and-undo",
      ],
    },
    {
      type: "category",
      label: "✂️ Artist Tools (v1.5.0)",
      collapsed: false,
      items: [
        "guides/selection-tools",
        "guides/transform-operations",
        "guides/clipboard-pipeline",
      ],
    },
    {
      type: "category",
      label: "💾 Storage, Export & Replay",
      collapsed: true,
      items: ["guides/document-persistence", "guides/action-replay"],
    },
    {
      type: "category",
      label: "🖌️ Custom Brushes & Dynamics",
      collapsed: true,
      items: [
        "guides/image-brushes",
        "guides/modules",
        "guides/modules-advanced",
        "guides/standalone-brush",
        "guides/performance",
      ],
    },
    {
      type: "category",
      label: "🧩 Framework Integrations",
      collapsed: true,
      items: [
        "guides/integration-react",
        "guides/integration-vue",
        "guides/integration-svelte",
      ],
    },
    {
      type: "category",
      label: "📖 Complete API Reference",
      collapsed: true,
      items: [
        "api/canvas",
        "api/brush",
        "api/layer",
        "api/blend-modes",
        "api/selection",
        "api/transform",
        "api/clipboard",
        "api/history",
        "api/actions-and-replay",
        "api/persistence",
        "api/modules",
        "api/configuration",
      ],
    },
    "troubleshooting",
    "documentation-guide",
  ],
};

export default sidebars;
