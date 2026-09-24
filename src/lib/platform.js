import { Platform } from "react-native";

// Plateformes cibles gérées par le store (cf. modèle `versions.platform`)
export const PLATFORMS = [
    { id: "android", label: "Android", icon: "android" },
    { id: "windows", label: "Windows", icon: "microsoft-windows" },
    { id: "macos", label: "macOS", icon: "apple" },
    { id: "linux", label: "Linux", icon: "linux" },
];

// Formats installables par plateforme, du plus recommandé au moins recommandé
export const FORMATS_BY_PLATFORM = {
    android: ["apk"],
    windows: ["exe", "msi"],
    macos: ["dmg", "pkg"],
    linux: ["appimage", "deb", "rpm"],
};

export const FORMAT_MIME = {
    apk: "application/vnd.android.package-archive",
    exe: "application/vnd.microsoft.portable-executable",
    msi: "application/x-msi",
    dmg: "application/x-apple-diskimage",
    pkg: "application/octet-stream",
    appimage: "application/octet-stream",
    deb: "application/vnd.debian.binary-package",
    rpm: "application/x-rpm",
};

export function platformLabel(id) {
    return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export function platformIcon(id) {
    return PLATFORMS.find((p) => p.id === id)?.icon ?? "help-circle-outline";
}

export function formatLabel(format) {
    return format === "appimage" ? "AppImage" : String(format || "").toUpperCase();
}

export function isElectron() {
    return Platform.OS === "web" && typeof window !== "undefined" && !!window.kaskad?.isElectron;
}

function detectFromUserAgent() {
    if (typeof navigator === "undefined") return "unknown";
    const ua = navigator.userAgent || "";
    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ipod/i.test(ua)) return "ios";
    if (/windows/i.test(ua)) return "windows";
    if (/macintosh|mac os x/i.test(ua)) return "macos";
    if (/linux|x11/i.test(ua)) return "linux";
    return "unknown";
}

const NODE_PLATFORM = { win32: "windows", darwin: "macos", linux: "linux" };

let cached;

/**
 * Détecte la plateforme du terminal pour prioriser les formats compatibles.
 * Retourne l'identifiant utilisé par l'API (`android`, `windows`, `macos`, `linux`)
 * ou `ios` / `unknown` quand aucun format n'est installable nativement.
 */
export function detectPlatform() {
    if (cached) return cached;
    let os;
    if (Platform.OS === "android" || Platform.OS === "ios") os = Platform.OS;
    else if (isElectron()) os = NODE_PLATFORM[window.kaskad.platform] ?? "unknown";
    else os = detectFromUserAgent();

    cached = {
        os,
        isElectron: isElectron(),
        isDesktop: ["windows", "macos", "linux"].includes(os),
        // Plateforme "store" (null si le terminal n'a pas de format installable, ex. iOS)
        target: FORMATS_BY_PLATFORM[os] ? os : null,
        preferredFormats: FORMATS_BY_PLATFORM[os] ?? [],
    };
    return cached;
}

/** Trie les versions pour mettre en avant celles compatibles avec le terminal. */
export function sortVersionsForDevice(versions = []) {
    const { target, preferredFormats } = detectPlatform();
    const rank = (v) => {
        if (v.platform !== target) return 100;
        const i = preferredFormats.indexOf(v.file_format);
        return i === -1 ? 50 : i;
    };
    return [...versions].sort(
        (a, b) => rank(a) - rank(b) || (b.version_code ?? 0) - (a.version_code ?? 0),
    );
}

/** Dernière version compatible avec le terminal (ou null). */
export function bestVersionForDevice(versions = []) {
    const { target } = detectPlatform();
    if (!target) return null;
    return sortVersionsForDevice(versions).find((v) => v.platform === target) ?? null;
}

/** Place les apps disponibles pour le terminal en premier, sans masquer les autres. */
export function compatibleFirst(apps = []) {
    const { target } = detectPlatform();
    if (!target) return apps;
    return [...apps].sort((a, b) => (b.platforms?.includes(target) ?? 0) - (a.platforms?.includes(target) ?? 0));
}
