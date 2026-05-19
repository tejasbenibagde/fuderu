// src/utils/color.ts

/**
 * Important Note:-
 * This file should remain in TypeScript unless Fuderu later
 * implements advanced color engines, HDR pipelines,
 * spectral painting, or GPU-side color processing.
 *
 * Current implementation is optimized for:
 * - Zero DOM usage
 * - Better portability
 * - Better performance
 * - Deterministic parsing
 * - Cache-friendly architecture
 */

const DEFAULT_COLOR = "#000000";

const COLOR_CACHE = new Map<string, string>();

const HEX_SHORT_REGEX = /^#([0-9a-fA-F]{3})$/;

const HEX_LONG_REGEX = /^#([0-9a-fA-F]{6})$/;

const RGB_REGEX =
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

const RGBA_REGEX =
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const clampColorChannel = (value: number): number => {
    if (value <= 0) return 0;

    if (value >= 255) return 255;

    return value | 0;
};

const toHex = (value: number): string => {
    return clampColorChannel(value)
        .toString(16)
        .padStart(2, "0");
};

const rgbToHex = (
    r: number,
    g: number,
    b: number
): string => {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/* -------------------------------------------------------------------------- */
/*                             Main Color Utility                             */
/* -------------------------------------------------------------------------- */

/**
 * Convert input color string to normalized 6-digit hex color.
 *
 * Supported formats:
 * - #fff
 * - #ffffff
 * - rgb(r, g, b)
 * - rgba(r, g, b, a)
 *
 * Unsupported/invalid formats return:
 * #000000
 */
export const toHashColor = (
    color: string
): string => {
    if (typeof color !== "string") {
        return DEFAULT_COLOR;
    }

    const normalized =
        color.trim().toLowerCase();

    if (!normalized) {
        return DEFAULT_COLOR;
    }

    /* ------------------------------ Cache Hit ------------------------------ */

    const cached =
        COLOR_CACHE.get(normalized);

    if (cached) {
        return cached;
    }

    /* ---------------------------- #ffffff Case ---------------------------- */

    if (HEX_LONG_REGEX.test(normalized)) {
        COLOR_CACHE.set(
            normalized,
            normalized
        );

        return normalized;
    }

    /* ----------------------------- #fff Case ------------------------------ */

    const shortHexMatch =
        normalized.match(HEX_SHORT_REGEX);

    if (shortHexMatch) {
        const hex =
            shortHexMatch[1];

        const expanded =
            `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;

        COLOR_CACHE.set(
            normalized,
            expanded
        );

        return expanded;
    }

    /* ----------------------------- rgb() Case ----------------------------- */

    const rgbMatch =
        normalized.match(RGB_REGEX);

    if (rgbMatch) {
        const r = Number(rgbMatch[1]);
        const g = Number(rgbMatch[2]);
        const b = Number(rgbMatch[3]);

        const hex =
            rgbToHex(r, g, b);

        COLOR_CACHE.set(
            normalized,
            hex
        );

        return hex;
    }

    /* ---------------------------- rgba() Case ----------------------------- */

    const rgbaMatch =
        normalized.match(RGBA_REGEX);

    if (rgbaMatch) {
        const r = Number(rgbaMatch[1]);
        const g = Number(rgbaMatch[2]);
        const b = Number(rgbaMatch[3]);

        // Alpha intentionally ignored
        // because output format is #RRGGBB

        const hex =
            rgbToHex(r, g, b);

        COLOR_CACHE.set(
            normalized,
            hex
        );

        return hex;
    }

    /* ---------------------------- Invalid Input --------------------------- */

    return DEFAULT_COLOR;
};