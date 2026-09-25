import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import { api } from "@/api";
import { getLanguage } from "@/i18n";
import { useAuthStore } from "@/store/auth";
import { snapshot, useLibraryStore } from "@/store/library";
import { useSettingsStore } from "@/store/settings";
import { getPushToken } from "./notifications";

export function getDeviceId() {
    const { deviceId, setDeviceId } = useAuthStore.getState();
    if (deviceId) return deviceId;
    const id = Crypto.randomUUID();
    setDeviceId(id);
    return id;
}

// ------------------------------------------------------------------ session

async function afterLogin(session) {
    useAuthStore.getState().setSession(session);
    await mergeServerLibrary().catch(() => {});
    await syncLibraryNow().catch(() => {});
    await registerPushToken().catch(() => {});
}

export async function login(email, password) {
    await afterLogin(await api.login({ email: email.trim().toLowerCase(), password }));
}

export async function register(email, password, name) {
    await afterLogin(await api.register({ email: email.trim().toLowerCase(), password, name: name.trim() }));
}

/** Nom public du compte (affiché avec ses avis). */
export async function updateName(name) {
    useAuthStore.getState().setUser(await api.updateMe({ name: name.trim() }));
}

export async function loginAnonymous() {
    await afterLogin(await api.loginAnonymous({ device_id: getDeviceId() }));
}

/** Déconnexion : jeton push retiré du compte, session révoquée côté serveur. Les apps suivies et installées restent sur l'appareil. */
export async function logout() {
    const { refreshToken } = useAuthStore.getState();
    await unregisterPushToken().catch(() => {});
    if (refreshToken) await api.logout(refreshToken).catch(() => {});
    useAuthStore.getState().logout();
    // Les favoris appartiennent au compte : ils seront retrouvés à la prochaine connexion
    useLibraryStore.getState().clearFavorites();
}

/** Suppression définitive du compte côté serveur. Les apps suivies et installées restent sur l'appareil. */
export async function deleteAccount() {
    await api.deleteAccount();
    useAuthStore.getState().logout();
    useLibraryStore.getState().clearFavorites();
}

// ------------------------------------------------------------------ notifications push

export async function registerPushToken() {
    if (!useAuthStore.getState().user || !useSettingsStore.getState().notificationsEnabled) return;
    const token = await getPushToken();
    if (!token) return;
    await api.registerPushToken({ ...token, platform: token.platform ?? Platform.OS, language: getLanguage() });
    useAuthStore.getState().setPushToken(token.token);
}

/** Retire le jeton de l'appareil du compte : le serveur n'y envoie plus de notifications. */
export async function unregisterPushToken() {
    const { user, pushToken, setPushToken } = useAuthStore.getState();
    if (!user || !pushToken) return;
    await api.unregisterPushToken(pushToken);
    setPushToken(null);
}

// ------------------------------------------------------------------ bibliothèque

function libraryPayload() {
    const { favorites, installed, followed } = useLibraryStore.getState();
    return {
        favorites: Object.keys(favorites),
        followed_apps: Object.entries(followed).map(([app_id, f]) => ({ app_id, notify: !!f.notify })),
        installed_apps: Object.entries(installed).map(([app_id, i]) => ({ app_id, version_id: i.version_id })),
    };
}

/**
 * Fusionne la bibliothèque du compte (autre appareil, réinstallation…) avec celle de l'appareil :
 * favoris et apps suivies réunis, version installée la plus récente conservée, préférence locale prioritaire.
 */
export async function mergeServerLibrary() {
    if (!useAuthStore.getState().user) return;
    const [remote, myApps] = await Promise.all([api.getLibrary(), api.getMyApps()]);
    const local = useLibraryStore.getState();
    const favorites = { ...local.favorites };
    const followed = { ...local.followed };
    const installed = { ...local.installed };

    // Favoris présents uniquement sur le compte : on récupère leurs fiches pour l'affichage hors ligne
    const missingFavorites = (remote.favorites ?? []).filter((id) => !favorites[id]);
    if (missingFavorites.length) {
        const { items } = await api.listApps({ ids: missingFavorites.join(","), limit: 100 });
        items.forEach((app) => (favorites[app.id] = snapshot(app)));
    }

    for (const item of myApps ?? []) {
        const app = snapshot(item.app);
        if (item.followed && !followed[app.id]) followed[app.id] = { app, notify: item.notify };
        const v = item.installed_version;
        if (v && (!installed[app.id] || installed[app.id].version_code < v.version_code)) {
            installed[app.id] = {
                app,
                version_id: v.id,
                version_name: v.version_name,
                version_code: v.version_code,
                platform: v.platform,
                file_format: v.file_format,
                installed_at: new Date().toISOString(),
            };
        }
    }
    local.replaceAll({ favorites, followed, installed });
}

/** Remet à jour les fiches affichées dans Favoris et Mes apps (textes dans la langue actuelle de l'app). */
export async function refreshLibrarySnapshots() {
    const { favorites, installed, followed } = useLibraryStore.getState();
    const ids = [...new Set([...Object.keys(favorites), ...Object.keys(installed), ...Object.keys(followed)])];
    if (!ids.length) return;
    const { items } = await api.listApps({ ids: ids.slice(0, 100).join(","), limit: 100 });
    useLibraryStore.getState().refreshSnapshots(items);
}

export function syncLibraryNow() {
    if (!useAuthStore.getState().user) return Promise.resolve();
    return api.syncLibrary(libraryPayload());
}

let timer = null;
/** Synchronise favoris / apps suivies / installées avec le compte (si connecté). */
export function startLibrarySync() {
    return useLibraryStore.subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(() => syncLibraryNow().catch(() => {}), 1000);
    });
}
