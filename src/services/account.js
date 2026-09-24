import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import { api } from "@/api";
import { useAuthStore } from "@/store/auth";
import { useLibraryStore } from "@/store/library";
import { useSettingsStore } from "@/store/settings";
import { getPushToken } from "./notifications";

export function getDeviceId() {
    const { deviceId, setDeviceId } = useAuthStore.getState();
    if (deviceId) return deviceId;
    const id = Crypto.randomUUID();
    setDeviceId(id);
    return id;
}

async function afterLogin(session) {
    useAuthStore.getState().setSession(session);
    await syncLibraryNow().catch(() => {});
    await registerPushToken().catch(() => {});
}

export async function login(email, password) {
    await afterLogin(await api.login({ email: email.trim().toLowerCase(), password }));
}

export async function register(email, password) {
    await afterLogin(await api.register({ email: email.trim().toLowerCase(), password }));
}

export async function loginAnonymous() {
    await afterLogin(await api.loginAnonymous({ device_id: getDeviceId() }));
}

export function logout() {
    useAuthStore.getState().logout();
}

export async function registerPushToken() {
    if (!useAuthStore.getState().user || !useSettingsStore.getState().notificationsEnabled) return;
    const token = await getPushToken();
    if (token) await api.registerPushToken({ ...token, platform: token.platform ?? Platform.OS });
}

function libraryPayload() {
    const { favorites, installed, followed } = useLibraryStore.getState();
    return {
        favorites: Object.keys(favorites),
        followed_apps: Object.entries(followed).map(([app_id, f]) => ({ app_id, notify: !!f.notify })),
        installed_apps: Object.entries(installed).map(([app_id, i]) => ({ app_id, version_id: i.version_id })),
    };
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
