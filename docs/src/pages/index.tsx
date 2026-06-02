import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import FuderuDemo from "@site/src/components/FuderuDemo";
import styles from "./index.module.css";

const features = [
  {
    title: "Pointer-ready canvas",
    body: "Use the Canvas wrapper when you want pressure-aware pointer drawing with undo, redo, clear, and cleanup helpers already wired.",
  },
  {
    title: "Standalone brush engine",
    body: "Use Brush directly when you manage input, replay strokes, or need lower-level control over rendering and compositing.",
  },
  {
    title: "Composable brush effects",
    body: "Layer modules for dynamic shape, transparency, spread, and pattern texture without replacing the core renderer.",
  },
];

export default function Home(): ReactNode {
  const logoUrl = useBaseUrl("/img/fuderu.webp");

  return (
    <Layout
      title="Fuderu"
      description="Lightweight canvas drawing engine for the web."
    >
      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <Heading as="h1" className={styles.title}>
                <img
                  className={styles.heroLogo}
                  src={logoUrl}
                  alt="Fuderu"
                  width={420}
                  height={142}
                />
              </Heading>
              <p className={styles.subtitle}>
                Fuderu 0.8.7 brings spacing-aware flow, explicit document
                sizing, smooth brush strokes, pressure-aware input, image
                stamps, and runtime effects.
              </p>
              <div className={styles.actions}>
                <Link
                  className="button button--primary button--lg"
                  to="/editor"
                >
                  Open editor
                </Link>
                <Link
                  className="button button--secondary button--lg"
                  to="/docs/intro"
                >
                  Read the docs
                </Link>
              </div>
            </div>
            <div className={styles.preview}>
              <FuderuDemo compact />
              <div className={styles.previewHint}>Paint something 🎨</div>
            </div>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <article className={styles.feature} key={feature.title}>
                <Heading as="h2">{feature.title}</Heading>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
