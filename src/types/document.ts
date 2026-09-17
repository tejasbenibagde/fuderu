import type { BlendMode, LayerId } from "./layers";

/**
 * Strongly-typed identifier for persistent canvas documents.
 */
export type DocumentId = string;

/**
 * The current document schema version.
 */
export const CURRENT_DOCUMENT_VERSION = 1;

export type BitmapFormat = "png" | "jpeg" | "webp";

export interface SerializedLayer {
  id: LayerId;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  alphaLock?: boolean;
  locked?: boolean;
  dataUrl: string;
}

export interface FuderuDocument {
  id?: DocumentId;
  version: number;
  width: number;
  height: number;
  layers: SerializedLayer[];
  activeLayerId?: LayerId;
}

export interface ExportDocumentOptions {
  bitmap?: BitmapFormat;
  quality?: number;
}

export interface ExportPNGOptions {
  includeBackground?: boolean;
  quality?: number;
}

/**
 * Pipeline that validates and migrates any document schema version
 * forward to CURRENT_DOCUMENT_VERSION.
 */
export function migrateDocument(rawDoc: unknown): FuderuDocument {
  if (!rawDoc || typeof rawDoc !== "object") {
    throw new Error(
      "Invalid FuderuDocument payload: payload must be an object",
    );
  }

  const doc = rawDoc as Record<string, unknown>;

  if (
    typeof doc.width !== "number" ||
    typeof doc.height !== "number" ||
    doc.width <= 0 ||
    doc.height <= 0
  ) {
    throw new Error(
      "Invalid FuderuDocument payload: width and height must be positive numbers",
    );
  }

  if (!Array.isArray(doc.layers)) {
    throw new Error("Invalid FuderuDocument payload: layers must be an array");
  }

  const version = typeof doc.version === "number" ? doc.version : 1;

  if (version > CURRENT_DOCUMENT_VERSION) {
    throw new Error(
      `Unsupported document version ${version}. Current maximum supported version is ${CURRENT_DOCUMENT_VERSION}.`,
    );
  }

  // Version-by-version forward migration pipeline
  const migrated: FuderuDocument = {
    id: typeof doc.id === "string" ? doc.id : undefined,
    version,
    width: doc.width,
    height: doc.height,
    layers: doc.layers.map((l: unknown, idx: number) => {
      const layer = (l && typeof l === "object" ? l : {}) as Record<
        string,
        unknown
      >;
      return {
        id: (typeof layer.id === "string"
          ? layer.id
          : `layer-${idx}`) as LayerId,
        name: typeof layer.name === "string" ? layer.name : `Layer ${idx + 1}`,
        visible: typeof layer.visible === "boolean" ? layer.visible : true,
        opacity:
          typeof layer.opacity === "number"
            ? Math.min(1, Math.max(0, layer.opacity))
            : 1,
        blendMode: (typeof layer.blendMode === "string"
          ? layer.blendMode
          : "source-over") as BlendMode,
        alphaLock: Boolean(layer.alphaLock),
        locked: Boolean(layer.locked),
        dataUrl: typeof layer.dataUrl === "string" ? layer.dataUrl : "",
      };
    }),
    activeLayerId:
      typeof doc.activeLayerId === "string"
        ? (doc.activeLayerId as LayerId)
        : undefined,
  };

  // When future versions (e.g. version 2, 3) are introduced, migration functions are chained here:
  // if (migrated.version === 1) { migrated = migrateV1ToV2(migrated); }

  migrated.version = CURRENT_DOCUMENT_VERSION;
  return migrated;
}
