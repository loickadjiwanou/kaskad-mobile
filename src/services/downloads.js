import { api } from "@/api";
import { t } from "@/i18n";
import { normalizeHash, sanitizeFileName } from "@/lib/format";
import { detectPlatform, formatLabel } from "@/lib/platform";
import { ACTIVE_STATUSES, useDownloadsStore } from "@/store/downloads";
import { useProgressStore } from "@/store/progress";
import * as downloader from "./downloader";
import { toast } from "@/lib/dialog";
import { notifyLocal } from "./notifications";

const store = () => useDownloadsStore.getState();
const progress = () => useProgressStore.getState();

export const downloadCapabilities = {
    pause: downloader.supportsPause,
    resume: downloader.supportsResume,
};

export function fileNameFor(app, version) {
    const ext = version.file_format === "appimage" ? "AppImage" : version.file_format;
    return sanitizeFileName(`${app.name}-${version.version_name}-${version.platform}.${ext}`);
}

export function findActiveForVersion(versionId) {
    return store().items.find((it) => it.versionId === versionId && [...ACTIVE_STATUSES, "paused"].includes(it.status));
}

/** Lance le téléchargement d'une version. Ne déclenche jamais d'installation. */
export function startDownload(app, version) {
    const existing = findActiveForVersion(version.id);
    if (existing) {
        if (existing.status === "paused") resumeDownload(existing.id);
        return existing.id;
    }

    // L'historique garde une seule entrée par version : un nouveau téléchargement remplace l'ancien
    store()
        .items.filter((it) => it.versionId === version.id)
        .forEach((it) => store().remove(it.id));

    const fileName = fileNameFor(app, version);
    const item = {
        id: `${version.id}-${Date.now()}`,
        appId: app.id,
        appName: app.name,
        appIcon: app.icon_url ?? null,
        versionId: version.id,
        versionName: version.version_name,
        versionCode: version.version_code,
        platform: version.platform,
        format: version.file_format,
        fileName,
        url: api.getDownloadUrl(version, detectPlatform().target ?? undefined),
        size: version.file_size ?? null,
        sha256: version.sha256_hash ?? null,
        status: "queued",
        bytesWritten: 0,
        localUri: downloader.localPathFor(fileName),
        savedUri: null,
        resumeData: null,
        error: null,
        verified: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
    };
    store().add(item);
    toast(t("download.startedToast", { name: app.name }));
    run(item.id);
    return item.id;
}

async function run(id) {
    const item = store().get(id);
    if (!item) return;
    store().update(id, { status: "downloading", error: null, interrupted: false });
    progress().set(id, item.bytesWritten ?? 0, item.size ?? 0);

    let last = 0;
    const onProgress = (written, total) => {
        const now = Date.now();
        if (now - last < 200 && written < total) return;
        last = now;
        progress().set(id, written, total || item.size || 0);
    };

    try {
        const res = await downloader.start(item, { onProgress });
        const current = store().get(id);
        if (!current || current.status === "canceled") return;
        const written = progress().byId[id]?.written ?? current.bytesWritten;

        if (res.status === "paused") {
            store().update(id, { status: "paused", resumeData: res.resumeData ?? current.resumeData, bytesWritten: written });
        } else if (res.status === "canceled") {
            store().update(id, { status: "canceled" });
            progress().clear(id);
        } else {
            store().update(id, {
                status: "completed",
                localUri: res.localUri ?? null,
                savedUri: res.savedUri ?? null,
                handledByBrowser: !!res.handledByBrowser,
                bytesWritten: res.bytesWritten ?? current.size ?? written,
                resumeData: null,
                completedAt: new Date().toISOString(),
            });
            progress().clear(id);
            toast(t("download.doneToast", { name: current.appName, version: current.versionName }), { type: "success" });
            notifyLocal({
                title: t("download.notifyDoneTitle"),
                body: t("download.notifyDoneBody", { name: current.appName, version: current.versionName, format: formatLabel(current.format) }),
                data: { url: "/downloads" },
            });
        }
    } catch (e) {
        const current = store().get(id);
        if (!current || current.status === "canceled") return;
        toast(t("download.failedToast", { name: current.appName }), { type: "error" });
        store().update(id, {
            status: "failed",
            error: e?.message || t("download.errors.interrupted"),
            resumeData: e?.noResume ? null : (e?.resumeData ?? current.resumeData),
            bytesWritten: e?.noResume ? 0 : (progress().byId[id]?.written ?? current.bytesWritten),
        });
    }
}

export async function pauseDownload(id) {
    if (!downloadCapabilities.pause) return;
    const resumeData = await downloader.pause(id);
    const current = store().get(id);
    if (!current) return;
    store().update(id, {
        status: "paused",
        resumeData: resumeData ?? current.resumeData,
        bytesWritten: progress().byId[id]?.written ?? current.bytesWritten,
    });
}

export function resumeDownload(id) {
    return run(id);
}

/** Recommence depuis zéro (utile si la reprise n'est pas acceptée par le serveur). */
export async function restartDownload(id) {
    const item = store().get(id);
    if (!item) return;
    await downloader.removeFile(item);
    store().update(id, { resumeData: null, bytesWritten: 0, verified: null });
    return run(id);
}

export async function cancelDownload(id) {
    const item = store().get(id);
    if (!item) return;
    store().update(id, { status: "canceled", resumeData: null });
    progress().clear(id);
    await downloader.cancel(item).catch(() => {});
}

export async function removeDownload(id, { deleteFile = false } = {}) {
    const item = store().get(id);
    if (!item) return;
    if (ACTIVE_STATUSES.includes(item.status)) await cancelDownload(id);
    if (deleteFile || item.status !== "completed") await downloader.removeFile(item).catch(() => {});
    progress().clear(id);
    store().remove(id);
}

/** Calcule le SHA-256 du fichier téléchargé et le compare à celui publié. */
export async function verifyDownload(id) {
    const item = store().get(id);
    if (!item) return null;
    const computed = await downloader.sha256(item);
    const verified = !!item.sha256 && normalizeHash(computed) === normalizeHash(item.sha256);
    store().update(id, { verified, computedHash: computed });
    return { verified, computed };
}

export const revealDownload = (id) => downloader.reveal(store().get(id));
export const shareDownload = (id) => downloader.share(store().get(id));
export const fileExists = (id) => downloader.fileExists(store().get(id));
export const locationLabel = (item) => downloader.locationLabel(item);

export async function saveDownloadToDevice(id) {
    const savedUri = await downloader.saveToDevice(store().get(id));
    if (savedUri) store().update(id, { savedUri });
    return savedUri;
}
