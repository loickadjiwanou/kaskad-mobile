import { api } from "@/api";
import { toast } from "@/lib/dialog";
import { t } from "@/i18n";
import { useAuthStore } from "@/store/auth";
import { useLibraryStore } from "@/store/library";
import { useUpdatesStore } from "@/store/updates";
import { notifyLocal, setBadgeCount } from "./notifications";

let inflight = null;

/**
 * Vérifie les nouvelles versions des apps marquées "installées".
 * Met à jour le badge et notifie une seule fois par nouvelle version (si l'app suivie a les notifications actives).
 */
export function checkForUpdates() {
    inflight ??= doCheck().finally(() => {
        inflight = null;
    });
    return inflight;
}

async function doCheck() {
    const { installed, followed } = useLibraryStore.getState();
    const payload = Object.entries(installed).map(([app_id, i]) => ({
        app_id,
        version_id: i.version_id,
        version_code: i.version_code,
        platform: i.platform,
    }));
    const updates = useUpdatesStore.getState();
    if (!payload.length) {
        updates.setAvailable({});
        await setBadgeCount(0);
        return {};
    }

    // Identifiant aléatoire de l'appareil (haché par le serveur) : statistiques des versions réellement installées
    const results = await api.checkUpdates(payload, useAuthStore.getState().deviceId ?? undefined);
    const available = Object.fromEntries(results.map((r) => [r.app_id, r.latest_version]));
    updates.setAvailable(available);
    await setBadgeCount(results.length);

    for (const { app_id, latest_version } of results) {
        if (!followed[app_id]?.notify) continue;
        if (updates.notified[app_id] === latest_version.version_code) continue;
        updates.markNotified(app_id, latest_version.version_code);
        const name = installed[app_id]?.app?.name ?? t("myApps.someApp");
        await notifyLocal({
            title: t("myApps.updateNotifTitle"),
            body: t("myApps.updateNotifBody", { name, version: latest_version.version_name }),
            data: { url: `/app/${app_id}` },
        });
    }
    return available;
}

/** Marque une version comme installée et retire la mise à jour correspondante si elle est à jour. */
export function markAppInstalled(app, version) {
    useLibraryStore.getState().markInstalled(app, version);
    toast(t("app.markedInstalled", { name: app.name }), { type: "success" });
    const { available, clear } = useUpdatesStore.getState();
    if (available[app.id] && available[app.id].version_code <= version.version_code) clear(app.id);
    setBadgeCount(Object.keys(useUpdatesStore.getState().available).length);
}

export function unmarkAppInstalled(appId) {
    useLibraryStore.getState().unmarkInstalled(appId);
    useUpdatesStore.getState().clear(appId);
    setBadgeCount(Object.keys(useUpdatesStore.getState().available).length);
}
