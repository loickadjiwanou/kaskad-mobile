// Données de démonstration utilisées tant que EXPO_PUBLIC_API_URL n'est pas défini.
// Les formes renvoyées sont identiques à celles attendues de l'API FastAPI.
import { getLanguage, t } from "@/i18n";
import { useAuthStore } from "@/store/auth";

const FILES = {
    small: {
        url: "https://proof.ovh.net/files/1Mb.dat",
        size: 1048576,
        sha256: "30e14955ebf1352266dc2ff8067e68104607e750abb9d3b36582b8af909fcb58",
    },
    medium: {
        url: "https://proof.ovh.net/files/10Mb.dat",
        size: 10485760,
        sha256: "e5b844cc57f57094ea4585e235f36c78c1cd222262bb89d53c94dcb4d6b3e55d",
    },
    large: {
        url: "https://proof.ovh.net/files/100Mb.dat",
        size: 104857600,
        sha256: "20492a4d0d84f8beb1767f6616229f85d44c2827b64bdbfb260ee12fa1109e0e",
    },
};

const FORMATS = {
    android: ["apk"],
    windows: ["exe", "msi"],
    macos: ["dmg"],
    linux: ["appimage", "deb"],
};

const categories = [
    { id: "cat-productivite", name: "Productivité", icon: "briefcase-outline", order: 1 },
    { id: "cat-jeux", name: "Jeux", icon: "gamepad-variant-outline", order: 2 },
    { id: "cat-utilitaires", name: "Utilitaires", icon: "tools", order: 3 },
    { id: "cat-multimedia", name: "Multimédia", icon: "play-circle-outline", order: 4 },
    { id: "cat-education", name: "Éducation", icon: "school-outline", order: 5 },
    { id: "cat-dev", name: "Développement", icon: "code-braces", order: 6 },
];

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// Comptes développeurs qui publient les apps de démonstration
const developers = {
    kaskad: { id: "dev-kaskad", name: "Kaskad" },
    nova: { id: "dev-studio-nova", name: "Studio Nova" },
};
const NOVA_APPS = new Set(["pixel-drift", "nebula-run", "lingo-cards"]);

function makeVersions(appId, platforms, history, fileKey) {
    const file = FILES[fileKey];
    const versions = [];
    history.forEach((h) => {
        platforms.forEach((platform) => {
            FORMATS[platform].forEach((format) => {
                versions.push({
                    id: `${appId}-${h.code}-${format}`,
                    app_id: appId,
                    version_name: h.name,
                    version_code: h.code,
                    platform,
                    file_format: format,
                    file_url: file.url,
                    file_size: file.size,
                    sha256_hash: file.sha256,
                    changelog: h.changelog,
                    security_scan_status: "passed",
                    published_at: daysAgo(h.days),
                    created_at: daysAgo(h.days + 1),
                });
            });
        });
    });
    return versions;
}

const shots = (id, n = 4) => Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/kaskad-${id}-${i}/540/960`);

const rawApps = [
    {
        id: "kaskad-notes",
        name: "Kaskad Notes",
        short_description: "Vos notes synchronisées, simples et rapides.",
        long_description:
            "Kaskad Notes est un bloc-notes minimaliste pensé pour la vitesse.\n\n• Éditeur Markdown avec aperçu instantané\n• Dossiers, étiquettes et recherche plein texte\n• Mode hors ligne complet\n• Export PDF et Markdown\n\nVos notes restent sur votre appareil tant que vous n'activez pas la synchronisation.",
        category_ids: ["cat-productivite"],
        platforms: ["android", "windows", "macos", "linux"],
        downloads_count: 48210,
        featured: true,
        file: "medium",
        history: [
            { name: "2.4.0", code: 240, days: 3, changelog: "• Nouveau mode focus\n• Export PDF amélioré\n• Corrections de bugs" },
            { name: "2.3.1", code: 231, days: 40, changelog: "• Correctif de synchronisation\n• Meilleures performances au démarrage" },
            { name: "2.3.0", code: 230, days: 75, changelog: "• Étiquettes colorées\n• Recherche plein texte" },
        ],
    },
    {
        id: "flux-tasks",
        name: "Flux Tasks",
        short_description: "Gestionnaire de tâches et de projets en kanban.",
        long_description:
            "Organisez vos projets avec des tableaux kanban, des listes et un calendrier.\n\n• Rappels intelligents\n• Sous-tâches et checklists\n• Vues liste, tableau et calendrier\n• Thème sombre",
        category_ids: ["cat-productivite"],
        platforms: ["android", "windows", "macos"],
        downloads_count: 21890,
        featured: true,
        file: "medium",
        history: [
            { name: "1.8.2", code: 182, days: 9, changelog: "• Vue calendrier hebdomadaire\n• Glisser-déposer plus fluide" },
            { name: "1.8.0", code: 180, days: 52, changelog: "• Sous-tâches\n• Rappels récurrents" },
        ],
    },
    {
        id: "pixel-drift",
        name: "Pixel Drift",
        short_description: "Course arcade en pixel art, 60 circuits.",
        long_description:
            "Enchaînez les dérapages sur 60 circuits rétro dans ce jeu de course arcade.\n\n• Mode carrière et contre-la-montre\n• Manette supportée\n• Classements hors ligne",
        category_ids: ["cat-jeux"],
        platforms: ["android", "windows"],
        downloads_count: 102340,
        featured: true,
        file: "large",
        history: [
            { name: "3.1.0", code: 310, days: 1, changelog: "• 10 nouveaux circuits\n• Nouveau véhicule : le Comet" },
            { name: "3.0.4", code: 304, days: 30, changelog: "• Optimisations sur les appareils modestes" },
        ],
    },
    {
        id: "nebula-run",
        name: "Nebula Run",
        short_description: "Runner spatial infini au rythme de la musique.",
        long_description: "Esquivez les astéroïdes au rythme d'une bande-son synthwave générée dynamiquement.",
        category_ids: ["cat-jeux"],
        platforms: ["android", "windows", "linux"],
        downloads_count: 64020,
        file: "medium",
        history: [
            { name: "1.2.0", code: 120, days: 14, changelog: "• Mode défi quotidien\n• Nouvelles pistes" },
            { name: "1.1.0", code: 110, days: 90, changelog: "• Première version publique" },
        ],
    },
    {
        id: "clearspace",
        name: "Clearspace",
        short_description: "Libérez de l'espace en analysant vos fichiers.",
        long_description: "Visualisez ce qui occupe votre stockage et supprimez les doublons en toute sécurité.",
        category_ids: ["cat-utilitaires"],
        platforms: ["android", "windows"],
        downloads_count: 15400,
        file: "small",
        history: [
            { name: "1.0.3", code: 103, days: 6, changelog: "• Détection des doublons plus rapide" },
            { name: "1.0.0", code: 100, days: 60, changelog: "• Première version" },
        ],
    },
    {
        id: "vault-pass",
        name: "Vault Pass",
        short_description: "Coffre-fort de mots de passe chiffré de bout en bout.",
        long_description:
            "Stockez vos identifiants dans un coffre chiffré (AES-256) et déverrouillez-le par biométrie.\n\n• Générateur de mots de passe\n• Audit de sécurité\n• Import depuis CSV",
        category_ids: ["cat-utilitaires", "cat-productivite"],
        platforms: ["android", "windows", "macos", "linux"],
        downloads_count: 33870,
        featured: true,
        file: "medium",
        history: [
            { name: "4.0.0", code: 400, days: 2, changelog: "• Nouveau moteur de chiffrement\n• Partage sécurisé" },
            { name: "3.9.5", code: 395, days: 45, changelog: "• Correctifs de sécurité" },
        ],
    },
    {
        id: "wave-player",
        name: "Wave Player",
        short_description: "Lecteur audio et vidéo léger, tous formats.",
        long_description: "Lisez tous vos fichiers audio et vidéo sans codec supplémentaire, avec égaliseur 10 bandes.",
        category_ids: ["cat-multimedia"],
        platforms: ["android", "windows", "macos", "linux"],
        downloads_count: 87650,
        file: "large",
        history: [
            { name: "5.2.1", code: 521, days: 20, changelog: "• Sous-titres ASS/SSA\n• Correctifs" },
            { name: "5.2.0", code: 520, days: 64, changelog: "• Égaliseur 10 bandes" },
        ],
    },
    {
        id: "snapframe",
        name: "Snapframe",
        short_description: "Captures d'écran annotées en un raccourci.",
        long_description: "Capturez, annotez et partagez en quelques secondes. Flou automatique des données sensibles.",
        category_ids: ["cat-multimedia", "cat-productivite"],
        platforms: ["windows", "macos", "linux"],
        downloads_count: 12040,
        file: "small",
        history: [{ name: "0.9.0", code: 90, days: 4, changelog: "• Enregistrement GIF\n• Flou automatique" }],
    },
    {
        id: "lingo-cards",
        name: "Lingo Cards",
        short_description: "Apprenez le vocabulaire par répétition espacée.",
        long_description: "Des cartes mémo intelligentes pour apprendre 12 langues, avec prononciation audio.",
        category_ids: ["cat-education"],
        platforms: ["android", "windows", "macos"],
        downloads_count: 9800,
        file: "small",
        history: [
            { name: "2.0.0", code: 200, days: 12, changelog: "• Nouvel algorithme de répétition\n• 4 nouvelles langues" },
            { name: "1.5.0", code: 150, days: 100, changelog: "• Statistiques de progression" },
        ],
    },
    {
        id: "terminal-kit",
        name: "Terminal Kit",
        short_description: "Terminal moderne avec onglets et SSH intégré.",
        long_description: "Un terminal rapide accéléré GPU, avec gestionnaire de connexions SSH et thèmes.",
        category_ids: ["cat-dev"],
        platforms: ["windows", "macos", "linux"],
        downloads_count: 27500,
        file: "medium",
        history: [
            { name: "1.6.0", code: 160, days: 5, changelog: "• Panneaux divisés\n• Thèmes personnalisés" },
            { name: "1.5.2", code: 152, days: 33, changelog: "• Correctifs SSH" },
        ],
    },
];

const apps = rawApps.map((a, i) => {
    const versions = makeVersions(a.id, a.platforms, a.history, a.file);
    const latest = a.history[0];
    return {
        id: a.id,
        name: a.name,
        short_description: a.short_description,
        long_description: a.long_description,
        icon_url: null,
        screenshots: shots(a.id),
        category_ids: a.category_ids,
        platforms: a.platforms,
        status: "published",
        downloads_count: a.downloads_count,
        featured: !!a.featured,
        developer: NOVA_APPS.has(a.id) ? developers.nova : developers.kaskad,
        latest_version_name: latest.name,
        created_at: daysAgo(a.history.at(-1).days + 1 + i),
        updated_at: daysAgo(latest.days),
        versions,
    };
});

// ---------------------------------------------------------------------------
// Notes et avis de démonstration (déterministes par app)

const REVIEW_POOL = [
    { rating: 5, author: "Camille", lang: "fr", body: "Excellente app, rapide et sans pub. Je recommande !" },
    { rating: 4, author: "Alex", lang: "en", body: "Works great. Would love a widget in the next version." },
    { rating: 5, author: "Moussa", lang: "fr", body: "Exactement ce que je cherchais, merci au développeur." },
    { rating: 3, author: "Jordan", lang: "en", body: "Good idea but a bit slow to start on my laptop." },
    { rating: 4, author: "Inès", lang: "fr", body: "Très pratique au quotidien, l'interface est claire." },
    { rating: 2, author: "Sam", lang: "en", body: "Crashed twice after the last update." },
    { rating: 5, author: "Léa", lang: "fr", body: "" },
    { rating: 1, author: "Chris", lang: "en", body: "Doesn't open on my device anymore." },
];

const reviewsByApp = Object.fromEntries(
    rawApps.map((a, i) => {
        const n = 3 + (i % 5);
        const items = Array.from({ length: n }, (_, k) => {
            const r = REVIEW_POOL[(i * 3 + k) % REVIEW_POOL.length];
            return {
                id: `rev-${a.id}-${k}`,
                app_id: a.id,
                rating: r.rating,
                body: r.body,
                author_name: r.author,
                version_name: a.history[0].name,
                language: r.lang,
                created_at: daysAgo(k * 4 + 1),
                updated_at: daysAgo(k * 4 + 1),
                reply:
                    k === 1
                        ? { body: r.lang === "fr" ? "Merci pour votre retour !" : "Thanks for your feedback!", author_name: NOVA_APPS.has(a.id) ? "Studio Nova" : "Kaskad", replied_at: daysAgo(k * 4) }
                        : null,
                is_mine: false,
            };
        });
        return [a.id, items];
    }),
);

function ratingOf(appId) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (reviewsByApp[appId] ?? []).forEach((r) => distribution[r.rating]++);
    const count = Object.values(distribution).reduce((a, b) => a + b, 0);
    const average = count ? Math.round((Object.entries(distribution).reduce((s, [k, v]) => s + k * v, 0) / count) * 100) / 100 : null;
    return { average, count, distribution };
}

const currentUserId = () => useAuthStore.getState().user?.id ?? null;
const mine = (r) => ({ ...r, is_mine: !!r.user_id && r.user_id === currentUserId() });

// ---------------------------------------------------------------------------

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms + Math.random() * 200));

function summary(app) {
    const { versions, long_description, screenshots, ...rest } = app;
    const { average, count } = ratingOf(app.id);
    return { ...rest, rating_average: average, rating_count: count };
}

function filterApps({ q, category_id, platform, developer_id } = {}) {
    const query = (q || "").trim().toLowerCase();
    return apps.filter((a) => {
        if (category_id && !a.category_ids.includes(category_id)) return false;
        if (developer_id && a.developer.id !== developer_id) return false;
        if (platform && !a.platforms.includes(platform)) return false;
        if (query) {
            const hay = `${a.name} ${a.short_description} ${a.long_description}`.toLowerCase();
            return query.split(/\s+/).every((w) => hay.includes(w));
        }
        return true;
    });
}

function sortApps(list, sort) {
    const sorted = [...list];
    if (sort === "popular") sorted.sort((a, b) => b.downloads_count - a.downloads_count);
    else if (sort === "recent") sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    return sorted;
}

export const mockApi = {
    async getCategories() {
        await delay();
        return [...categories].sort((a, b) => a.order - b.order);
    },

    // `platform` ne filtre pas : il sert à placer les apps compatibles en premier
    async getHome({ platform } = {}) {
        await delay();
        const compatibleFirst = (list) =>
            platform ? [...list].sort((a, b) => b.platforms.includes(platform) - a.platforms.includes(platform)) : list;
        const pool = compatibleFirst(apps);
        return {
            featured: pool.filter((a) => a.featured).map(summary),
            new: compatibleFirst(sortApps(pool, "recent")).slice(0, 8).map(summary),
            popular: compatibleFirst(sortApps(pool, "popular")).slice(0, 8).map(summary),
        };
    },

    async listApps({ q, category_id, platform, sort = "popular", page = 1, limit = 20, ids, developer_id } = {}) {
        await delay();
        let all = sortApps(filterApps({ q, category_id, platform, developer_id }), sort);
        if (ids) {
            const wanted = new Set(ids.split(","));
            all = all.filter((a) => wanted.has(a.id));
        }
        const start = (page - 1) * limit;
        return { items: all.slice(start, start + limit).map(summary), total: all.length, page, limit };
    },

    async getApp(id) {
        await delay();
        const app = apps.find((a) => a.id === id);
        if (!app) {
            const err = new Error("Application introuvable");
            err.status = 404;
            throw err;
        }
        const { average, count, distribution } = ratingOf(app.id);
        return {
            ...app,
            categories: categories.filter((c) => app.category_ids.includes(c.id)),
            rating_average: average,
            rating_count: count,
            rating_distribution: distribution,
            // Démo : pas de page web publique, le lien ouvre directement l'app Kaskad
            share_url: `kaskad://app/${app.id}`,
        };
    },

    async getDeveloper(id) {
        await delay();
        const dev = Object.values(developers).find((d) => d.id === id);
        if (!dev) {
            const err = new Error("Développeur introuvable");
            err.status = 404;
            throw err;
        }
        return { ...dev, apps_count: apps.filter((a) => a.developer.id === id).length };
    },

    async getReviews(appId, { sort = "recent", rating, page = 1, limit = 20 } = {}) {
        await delay();
        let items = [...(reviewsByApp[appId] ?? [])];
        if (rating) items = items.filter((r) => r.rating === Number(rating));
        items.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        if (sort === "rating_desc") items.sort((a, b) => b.rating - a.rating);
        if (sort === "rating_asc") items.sort((a, b) => a.rating - b.rating);
        const start = (page - 1) * limit;
        return { items: items.slice(start, start + limit).map(mine), total: items.length, page, limit, rating: ratingOf(appId) };
    },

    async getMyReview(appId) {
        await delay(100);
        const r = (reviewsByApp[appId] ?? []).find((x) => x.user_id && x.user_id === currentUserId());
        return r ? mine(r) : null;
    },

    async saveMyReview(appId, { rating, body = "", version_name = null }) {
        await delay();
        const user = useAuthStore.getState().user;
        if (!user || user.anonymous) throw Object.assign(new Error(t("reviews.emailRequired")), { status: 403 });
        const list = (reviewsByApp[appId] ??= []);
        const existing = list.find((x) => x.user_id === user.id);
        const fields = { rating, body: body.trim(), author_name: user.name || user.email.split("@")[0], version_name, updated_at: new Date().toISOString() };
        if (existing) Object.assign(existing, fields);
        else list.unshift({ id: `rev-${appId}-${Date.now()}`, app_id: appId, user_id: user.id, language: getLanguage(), created_at: fields.updated_at, reply: null, ...fields });
        return mine(list.find((x) => x.user_id === user.id));
    },

    async deleteMyReview(appId) {
        await delay(150);
        reviewsByApp[appId] = (reviewsByApp[appId] ?? []).filter((x) => !x.user_id || x.user_id !== currentUserId());
        return null;
    },

    async reportReview() {
        await delay(150);
        return null;
    },

    async reportApp() {
        await delay(200);
        return { detail: "ok" };
    },

    getDownloadUrl(version) {
        return version.file_url;
    },

    async checkUpdates(installed = []) {
        await delay(150);
        return installed
            .map(({ app_id, version_code, platform }) => {
                const app = apps.find((a) => a.id === app_id);
                if (!app) return null;
                const latest = app.versions
                    .filter((v) => !platform || v.platform === platform)
                    .sort((a, b) => b.version_code - a.version_code)[0];
                if (!latest || latest.version_code <= version_code) return null;
                return { app_id, latest_version: latest };
            })
            .filter(Boolean);
    },

    async register({ email, name }) {
        await delay();
        return mockSession({ id: `user-${email}`, email, name: name?.trim() || null, anonymous: false });
    },

    async updateMe({ name }) {
        await delay(150);
        const user = { ...useAuthStore.getState().user, name: name.trim() };
        Object.values(reviewsByApp).forEach((list) => list.forEach((r) => r.user_id === user.id && (r.author_name = user.name)));
        return user;
    },

    async login({ email }) {
        await delay();
        return mockSession({ id: `user-${email}`, email, anonymous: false });
    },

    async loginAnonymous({ device_id }) {
        await delay();
        return mockSession({ id: `device-${device_id}`, email: null, anonymous: true });
    },

    async syncLibrary(library) {
        await delay(100);
        mockLibrary = { favorites: [], followed_apps: [], installed_apps: [], ...library };
        return mockLibrary;
    },

    async getLibrary() {
        await delay(100);
        return mockLibrary;
    },

    async getMyApps() {
        await delay(100);
        const followed = Object.fromEntries(mockLibrary.followed_apps.map((f) => [f.app_id, f.notify]));
        const installed = Object.fromEntries(mockLibrary.installed_apps.map((i) => [i.app_id, i.version_id]));
        return [...new Set([...Object.keys(installed), ...Object.keys(followed)])]
            .map((id) => apps.find((a) => a.id === id))
            .filter(Boolean)
            .map((app) => {
                const current = app.versions.find((v) => v.id === installed[app.id]) ?? null;
                const latest =
                    app.versions
                        .filter((v) => !current || v.platform === current.platform)
                        .sort((a, b) => b.version_code - a.version_code)[0] ?? null;
                return {
                    app: summary(app),
                    followed: app.id in followed,
                    notify: followed[app.id] ?? false,
                    installed_version: current,
                    latest_version: latest,
                    update_available: !!(current && latest && latest.version_code > current.version_code),
                };
            });
    },

    async registerPushToken() {
        await delay(100);
        return null;
    },

    async unregisterPushToken() {
        await delay(50);
        return null;
    },

    async logout() {
        await delay(50);
        return null;
    },

    async deleteAccount() {
        await delay(150);
        mockLibrary = { favorites: [], followed_apps: [], installed_apps: [] };
        return null;
    },
};

// Bibliothèque "côté serveur" de la démo (réinitialisée au redémarrage de l'app)
let mockLibrary = { favorites: [], followed_apps: [], installed_apps: [] };

function mockSession(user) {
    return { access_token: `mock-${Date.now()}`, refresh_token: `mock-refresh-${Date.now()}`, user };
}
