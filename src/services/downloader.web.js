// Moteur de téléchargement web :
//  - Electron (desktop) : délégué au process principal via window.kaskad (dossier Téléchargements, pause/reprise, SHA-256) ;
//  - navigateur : téléchargement en flux avec progression si CORS le permet, sinon lien direct.
// Aucune installation n'est jamais déclenchée.
import { t } from "@/i18n";
import { toHex } from "@/lib/format";
import { isElectron } from "@/lib/platform";

const bridge = () => window.kaskad;
const controllers = new Map();

export const supportsResume = isElectron();
export const supportsPause = isElectron();

export function localPathFor() {
    return null;
}

export async function start(item, { onProgress }) {
    if (isElectron()) {
        const off = bridge().onDownloadProgress((id, received, total) => {
            if (id === item.id) onProgress(received, total);
        });
        try {
            const res = await bridge().download({
                id: item.id,
                url: item.url,
                fileName: item.fileName,
                resumeData: item.resumeData ?? null,
            });
            if (res.status === "paused") return { status: "paused", resumeData: res.resumeData ?? null };
            if (res.status === "completed") {
                if (item.size && res.bytes && res.bytes !== item.size) {
                    await bridge().removeFile(res.path);
                    throw Object.assign(new Error(t("download.errors.sizeMismatch")), {
                        noResume: true,
                    });
                }
                return { status: "completed", localUri: res.path, savedUri: res.path, bytesWritten: res.bytes };
            }
            if (res.status === "canceled") return { status: "canceled" };
            throw Object.assign(new Error(res.error || t("download.errors.interrupted")), { resumeData: res.resumeData ?? null });
        } finally {
            off();
        }
    }
    return browserDownload(item, onProgress);
}

async function browserDownload(item, onProgress) {
    const controller = new AbortController();
    controllers.set(item.id, controller);
    try {
        const res = await fetch(item.url, { signal: controller.signal });
        if (!res.ok || !res.body) throw new Error(t("download.errors.http", { status: res.status }));
        const total = Number(res.headers.get("content-length")) || item.size || 0;
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            onProgress(received, total);
        }
        const blob = new Blob(chunks, { type: "application/octet-stream" });
        triggerSave(URL.createObjectURL(blob), item.fileName, true);
        return { status: "completed", localUri: null, savedUri: null, bytesWritten: received };
    } catch (e) {
        if (e.name === "AbortError") return { status: "canceled" };
        // CORS ou flux indisponible : on laisse le navigateur gérer le téléchargement
        triggerSave(item.url, item.fileName, false);
        return { status: "completed", localUri: null, savedUri: null, handledByBrowser: true };
    } finally {
        controllers.delete(item.id);
    }
}

function triggerSave(href, fileName, revoke) {
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export async function pause(id) {
    if (isElectron()) return bridge().pause(id);
    return null;
}

export async function cancel(item) {
    if (isElectron()) {
        await bridge().cancel(item.id);
        if (item.localUri) await bridge().removeFile(item.localUri);
        return;
    }
    controllers.get(item.id)?.abort();
}

export async function removeFile(item) {
    if (isElectron() && item.localUri) await bridge().removeFile(item.localUri);
}

export async function saveToDevice() {
    return null;
}

export async function share() {
    return false;
}

/** Desktop : affiche le fichier dans l'explorateur (Finder / Explorateur Windows). */
export async function reveal(item) {
    if (isElectron() && item.localUri) {
        bridge().showInFolder(item.localUri);
        return true;
    }
    return false;
}

export async function fileExists(item) {
    if (isElectron() && item.localUri) return bridge().fileExists(item.localUri);
    return false;
}

export async function sha256(item) {
    if (isElectron() && item.localUri) return bridge().sha256(item.localUri);
    throw new Error(t("download.errors.browserVerify"));
}

// Utilisé par l'outil de vérification de la FAQ (fichier choisi par l'utilisateur dans le navigateur)
export async function sha256OfBlob(blob) {
    const buffer = await blob.arrayBuffer();
    return toHex(await crypto.subtle.digest("SHA-256", buffer));
}

export function locationLabel(item) {
    if (isElectron()) return item.localUri ?? t("download.locations.downloadsFolder");
    return t("download.locations.browser");
}
