// Contrat de l'API publique consommée par l'app client (PARTIE 2 — "API publique").
// Tous les écrans passent par ce module : le basculement mock → FastAPI se fait via EXPO_PUBLIC_API_URL.
import { buildUrl, request } from "./client";
import { USE_MOCK } from "./config";
import { mockApi } from "./mock";

const httpApi = {
    getCategories: () => request("/categories"),

    getHome: ({ platform } = {}) => request("/home", { params: { platform } }),

    // { items, total, page, limit }
    listApps: (params = {}) => request("/apps", { params }),

    // Détail + versions publiées (scan sécurité "passed" uniquement)
    getApp: (id) => request(`/apps/${encodeURIComponent(id)}`),

    // Le backend compte le téléchargement puis redirige (302) vers le fichier (URL signée).
    // `platform` : plateforme du terminal, pour les statistiques.
    getDownloadUrl: (version, platform) => buildUrl(`/versions/${encodeURIComponent(version.id)}/download`, { platform }),

    // installed: [{ app_id, version_id, version_code, platform }] → [{ app_id, latest_version }]
    checkUpdates: (installed) => request("/updates/check", { method: "POST", body: { installed } }),

    register: ({ email, password }) => request("/auth/register", { method: "POST", body: { email, password } }),
    login: ({ email, password }) => request("/auth/login", { method: "POST", body: { email, password } }),
    loginAnonymous: ({ device_id }) => request("/auth/anonymous", { method: "POST", body: { device_id } }),

    // Révoque la session côté serveur
    logout: (refresh_token) => request("/auth/logout", { method: "POST", body: { refresh_token } }),
    // Suppression définitive du compte et de ses données
    deleteAccount: () => request("/me", { method: "DELETE" }),

    // { favorites: [app_id], followed_apps: [{ app_id, notify }], installed_apps: [{ app_id, version_id }] }
    getLibrary: () => request("/me/library"),
    syncLibrary: (library) => request("/me/library", { method: "PUT", body: library }),
    // Apps suivies / installées du compte avec version installée, dernière version et update_available
    getMyApps: () => request("/me/apps"),

    registerPushToken: ({ token, provider, platform, language }) =>
        request("/me/push-tokens", { method: "POST", body: { token, provider, platform, language } }),
    unregisterPushToken: (token) => request(`/me/push-tokens/${encodeURIComponent(token)}`, { method: "DELETE" }),
};

export const api = USE_MOCK ? mockApi : httpApi;
export { USE_MOCK };
