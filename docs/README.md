# 📖 Fuderu Documentation Portal

Welcome to the documentation repository for the **fuderu** drawing library! This directory houses our official documentation portal—built using **Docusaurus**—to provide high-quality guides, API references, framework integrations, and tutorials for developers of all skill levels.

---

## 🛠️ Running the Docs Locally

You can run the documentation portal locally on your computer to view the pages with full styling and search capabilities.

### 1. Install Dependencies

Navigate into the `docs` folder (if you are not already there) and install the required npm packages:

```bash
# If you are at the repository root:
cd docs
npm install

# Or from the repository root directly:
npm install --prefix docs
```

### 2. Start the Development Server

Launch the live-reloading preview server:

```bash
# From inside the docs folder:
npm run start

# Or from the repository root:
npm run docs
```

This will spin up a local server (typically at `http://localhost:3000`) where you can explore the documentation and watch your edits update in real time!

---

## 📂 Directory Structure

The documentation folder is structured as follows:

```text
docs/
├── docs/                     # 📝 Document pages (written in Markdown/MDX)
│   ├── getting-started/      # Installation and quick-start tutorials
│   ├── guides/               # Topic-specific guides (framework integration, modules, etc.)
│   ├── api/                  # Complete API reference for Canvas, Brush, Layers, etc.
│   └── intro.mdx             # The main welcoming introduction page
├── src/                      # Custom React components, homepage, and pages
├── static/                   # Static assets (images, icons, styles)
├── docusaurus.config.ts      # Main Docusaurus configuration (themes, plugins, navbar)
└── sidebars.ts               # Controls the sidebar navigation order
```

---

## ✍️ Contribution Guidelines

Want to add a new guide, tutorial, or API document? Here’s how:

1. **Create/Edit Markdown files**: All core pages are found in `/docs/docs/` as `.md` or `.mdx` files. Feel free to use standard Markdown syntax alongside custom JSX components (thanks to MDX).
2. **Configure Navigation**: If you add a new page, make sure to add its reference ID to `/docs/sidebars.ts` under the correct category so it appears in the sidebar.
3. **Build Checklist**: Before submitting a pull request, run a production build to check for broken links or markdown syntax errors:
   ```bash
   # From the repository root:
   npm run docs:build
   ```
