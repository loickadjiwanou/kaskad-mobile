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

    // Le backend compte le téléchargement puis redirige (302) vers le fichier (URL signée)
    getDownloadUrl: (version) => buildUrl(`/versions/${encodeURIComponent(version.id)}/download`),

    // installed: [{ app_id, version_id, version_code, platform }] → [{ app_id, latest_version }]
    checkUpdates: (installed) => request("/updates/check", { method: "POST", body: { installed } }),

    register: ({ email, password }) => request("/auth/register", { method: "POST", body: { email, password } }),
    login: ({ email, password }) => request("/auth/login", { method: "POST", body: { email, password } }),
    loginAnonymous: ({ device_id }) => request("/auth/anonymous", { method: "POST", body: { device_id } }),

    // { favorites: [app_id], followed_apps: [{ app_id, notify }], installed_apps: [{ app_id, version_id }] }
    syncLibrary: (library) => request("/me/library", { method: "PUT", body: library }),

    registerPushToken: ({ token, provider, platform }) =>
        request("/me/push-tokens", { method: "POST", body: { token, provider, platform } }),
};

export const api = USE_MOCK ? mockApi : httpApi;
export { USE_MOCK };
