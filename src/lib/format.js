import { getLanguage, localeOf } from "@/i18n";

const decimal = (str) => (getLanguage() === "fr" ? str.replace(".", ",") : str);

export function formatBytes(bytes) {
    if (bytes == null || Number.isNaN(bytes)) return "—";
    const fr = getLanguage() === "fr";
    if (bytes < 1024) return `${bytes} ${fr ? "o" : "B"}`;
    const units = fr ? ["Ko", "Mo", "Go", "To"] : ["KB", "MB", "GB", "TB"];
    let value = bytes / 1024;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${decimal(value.toFixed(value < 10 ? 1 : 0))} ${units[i]}`;
}

export function formatDate(input, withTime = false) {
    if (!input) return "—";
    const date = new Date(input);
    const opts = { day: "numeric", month: "short", year: "numeric" };
    if (withTime) Object.assign(opts, { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString(localeOf(getLanguage()), opts);
}

export function formatCount(n) {
    if (n == null) return "0";
    if (n >= 1_000_000) return `${decimal((n / 1_000_000).toFixed(1).replace(".0", ""))} M`;
    if (n >= 1_000) return `${decimal((n / 1_000).toFixed(1).replace(".0", ""))} k`;
    return String(n);
}

export function percent(written, total) {
    if (!total) return 0;
    return Math.max(0, Math.min(1, written / total));
}

/** Groupe un hash hexadécimal par blocs de 8 pour faciliter la comparaison visuelle. */
export function chunkHash(hash = "") {
    return hash.match(/.{1,8}/g)?.join(" ") ?? "";
}

export function normalizeHash(hash = "") {
    return hash.replace(/[^a-f0-9]/gi, "").toLowerCase();
}

export function toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export function sanitizeFileName(name) {
    return String(name).replace(/[\\/:*?"<>|\s]+/g, "_");
}
