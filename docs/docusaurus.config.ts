import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Fuderu",
  tagline: "Lightweight canvas drawing engine for the web",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://tejasbenibagde.github.io",
  baseUrl: "/",
  organizationName: "tejasbenibagde",
  projectName: "fuderu",

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: true,
        docsRouteBasePath: "/docs",
        docsDir: "docs",
        searchBarPosition: "right",
        searchResultLimits: 8,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "",
      logo: {
        alt: "Fuderu logo",
        src: "img/fuderu.webp",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          to: "/editor",
          label: "Editor",
          position: "left",
        },
        {
          href: "https://www.npmjs.com/package/fuderu",
          label: "npm",
          position: "right",
        },
        {
          href: "https://github.com/tejasbenibagde/fuderu",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "/docs/intro",
            },
            {
              label: "Quick Start",
              to: "/docs/getting-started/quick-start",
            },
            {
              label: "API Reference",
              to: "/docs/api/canvas",
            },
          ],
        },
        {
          title: "Project",
          items: [
            {
              label: "npm",
              href: "https://www.npmjs.com/package/fuderu",
            },
            {
              label: "GitHub",
              href: "https://github.com/tejasbenibagde/fuderu",
            },
            {
              label: "Roadmap",
              href: "https://github.com/tejasbenibagde/fuderu/blob/main/ROADMAP.md",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Tejas Benibagde. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
