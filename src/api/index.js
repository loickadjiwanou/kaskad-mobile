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

    // Détail + versions publiées (scan sécurité "passed" uniquement) ; `developer` : compte qui publie l'app
    getApp: (id) => request(`/apps/${encodeURIComponent(id)}`),

    // Compte développeur : { id, name, apps_count } (ses apps : listApps({ developer_id }))
    getDeveloper: (id) => request(`/developers/${encodeURIComponent(id)}`),

    // Le backend compte le téléchargement puis redirige (302) vers le fichier (URL signée).
    // `platform` : plateforme du terminal, pour les statistiques.
    // Version bêta : jeton signé remis aux seuls testeurs (`download_token`)
    getDownloadUrl: (version, platform) =>
        buildUrl(`/versions/${encodeURIComponent(version.id)}/download`, { platform, t: version.download_token || undefined }),

    // Notes et avis : { items, total, page, limit, rating: { average, count, distribution } }
    // sort : recent | rating_desc | rating_asc ; rating : filtre 1 à 5
    getReviews: (appId, params = {}) => request(`/apps/${encodeURIComponent(appId)}/reviews`, { params }),
    // Avis du compte connecté (null si aucun) ; écriture réservée aux comptes e-mail (403 email_account_required)
    getMyReview: (appId) => request(`/apps/${encodeURIComponent(appId)}/reviews/mine`),
    // Le nom affiché est celui du compte
    saveMyReview: (appId, { rating, body, version_name }) =>
        request(`/apps/${encodeURIComponent(appId)}/reviews/mine`, { method: "PUT", body: { rating, body, version_name } }),
    deleteMyReview: (appId) => request(`/apps/${encodeURIComponent(appId)}/reviews/mine`, { method: "DELETE" }),
    // Signalements (sans compte possible) : reason = malware | abusive | copyright | misleading | broken | other
    reportReview: (reviewId, reason) => request(`/reviews/${encodeURIComponent(reviewId)}/report`, { method: "POST", body: { reason } }),
    reportApp: (appId, { reason, details }) => request(`/apps/${encodeURIComponent(appId)}/report`, { method: "POST", body: { reason, details } }),

    // installed: [{ app_id, version_id, version_code, platform }] → [{ app_id, latest_version }]
    checkUpdates: (installed) => request("/updates/check", { method: "POST", body: { installed } }),

    // `name` : nom public du compte (affiché avec ses avis)
    register: ({ email, password, name }) => request("/auth/register", { method: "POST", body: { email, password, name } }),
    login: ({ email, password }) => request("/auth/login", { method: "POST", body: { email, password } }),
    loginAnonymous: ({ device_id }) => request("/auth/anonymous", { method: "POST", body: { device_id } }),

    // Révoque la session côté serveur
    logout: (refresh_token) => request("/auth/logout", { method: "POST", body: { refresh_token } }),
    // Nom du compte (repris sur tous ses avis)
    updateMe: ({ name }) => request("/me", { method: "PATCH", body: { name } }),
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
