// Moteur de téléchargement mobile (Android / iOS).
// Le fichier est téléchargé dans l'espace de l'app (reprise possible), puis :
//  - Android : copié dans le dossier public choisi par l'utilisateur (Téléchargements) via SAF ;
//  - iOS : exposé dans l'app Fichiers (UIFileSharingEnabled) et partageable.
// Aucune installation n'est jamais déclenchée.
import { Platform } from "react-native";
import * as FS from "expo-file-system/legacy";
import { Directory, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Crypto from "expo-crypto";
import { t } from "@/i18n";
import { toHex } from "@/lib/format";
import { FORMAT_MIME } from "@/lib/platform";
import { useSettingsStore } from "@/store/settings";

const DIR = `${FS.documentDirectory}downloads/`;
const tasks = new Map();

export const supportsResume = true;
export const supportsPause = true;

export function localPathFor(fileName) {
    return DIR + fileName;
}

async function existingSize(uri) {
    const info = await FS.getInfoAsync(uri);
    return info.exists ? info.size : 0;
}

export async function start(item, { onProgress }) {
    await FS.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
    const fileUri = item.localUri ?? localPathFor(item.fileName);

    let resumeData = item.resumeData ?? null;
    // Android reprend via l'en-tête Range à partir de la taille déjà écrite (même après un redémarrage)
    if (!resumeData && Platform.OS === "android" && item.bytesWritten > 0) {
        const size = await existingSize(fileUri);
        if (size > 0) resumeData = String(size);
    }
    if (!resumeData) await FS.deleteAsync(fileUri, { idempotent: true });

    const task = FS.createDownloadResumable(
        item.url,
        fileUri,
        {},
        (p) => onProgress(p.totalBytesWritten, p.totalBytesExpectedToWrite),
        resumeData ?? undefined,
    );
    tasks.set(item.id, task);

    try {
        const res = resumeData ? await task.resumeAsync() : await task.downloadAsync();
        if (!res) return { status: "paused", resumeData: task.savable().resumeData ?? null };
        if (res.status >= 400) throw new Error(t("download.errors.http", { status: res.status }));

        const size = await existingSize(res.uri);
        if (item.size && size !== item.size) {
            await FS.deleteAsync(res.uri, { idempotent: true });
            throw Object.assign(new Error(t("download.errors.sizeMismatch")), {
                noResume: true,
            });
        }
        const savedUri = await exportToPublicStorage(item, res.uri).catch(() => null);
        return { status: "completed", localUri: res.uri, savedUri, bytesWritten: size };
    } catch (e) {
        if (!e.noResume) {
            try {
                e.resumeData = task.savable().resumeData ?? null;
            } catch {}
        }
        throw e;
    } finally {
        tasks.delete(item.id);
    }
}

export async function pause(id) {
    const task = tasks.get(id);
    if (!task) return null;
    const state = await task.pauseAsync();
    return state?.resumeData ?? null;
}

export async function cancel(item) {
    const task = tasks.get(item.id);
    if (task) await task.cancelAsync().catch(() => {});
    tasks.delete(item.id);
    await removeFile(item);
}

export async function removeFile(item) {
    if (item.localUri) await FS.deleteAsync(item.localUri, { idempotent: true }).catch(() => {});
}

/**
 * Android : demande une fois l'accès au dossier Téléchargements (SAF) puis y copie le fichier.
 * Retourne l'URI publique, ou null si l'utilisateur refuse (le fichier reste dans l'app).
 */
async function exportToPublicStorage(item, localUri) {
    if (Platform.OS !== "android") return null;
    const { androidDownloadDirUri, setAndroidDownloadDirUri } = useSettingsStore.getState();
    let dir = androidDownloadDirUri ? new Directory(androidDownloadDirUri) : null;
    if (!dir) {
        const perm = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync(
            FS.StorageAccessFramework.getUriForDirectoryInRoot("Download"),
        );
        if (!perm.granted) return null;
        setAndroidDownloadDirUri(perm.directoryUri);
        dir = new Directory(perm.directoryUri);
    }
    try {
        const target = dir.createFile(item.fileName, FORMAT_MIME[item.format] ?? "application/octet-stream");
        target.write(await new File(localUri).bytes());
        return target.uri;
    } catch (e) {
        // Permission révoquée : on la redemandera au prochain téléchargement
        setAndroidDownloadDirUri(null);
        throw e;
    }
}

export async function saveToDevice(item) {
    if (!item.localUri) return null;
    return exportToPublicStorage(item, item.localUri);
}

/** Ouvre la feuille de partage (enregistrer dans Fichiers, envoyer, etc.). N'installe rien. */
export async function share(item) {
    if (!item.localUri || !(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(item.localUri, {
        mimeType: FORMAT_MIME[item.format] ?? "application/octet-stream",
        dialogTitle: item.fileName,
        UTI: "public.data",
    });
    return true;
}

export const reveal = share;

export async function fileExists(item) {
    return item.localUri ? (await existingSize(item.localUri)) > 0 : false;
}

/** SHA-256 du fichier téléchargé, calculé localement. */
export async function sha256(item) {
    const bytes = await new File(item.localUri).bytes();
    const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
    return toHex(digest);
}

export function locationLabel(item) {
    if (item.savedUri) return t("download.locations.downloadsFolder");
    return t(Platform.OS === "ios" ? "download.locations.iosFiles" : "download.locations.appStorage");
}
