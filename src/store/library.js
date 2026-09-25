import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "./storage";

// Instantané minimal d'une app pour l'afficher hors ligne (favoris, mes apps)
export const snapshot = (app) => ({
    id: app.id,
    name: app.name,
    short_description: app.short_description,
    icon_url: app.icon_url ?? null,
});

export const useLibraryStore = create(
    persist(
        (set) => ({
            // { [appId]: snapshot }
            favorites: {},
            // Apps marquées manuellement comme installées : { [appId]: { app, version_id, version_name, version_code, platform, file_format, installed_at } }
            installed: {},
            // Apps suivies (installées ou non) et préférence de notification : { [appId]: { app, notify } }
            followed: {},

            toggleFavorite: (app) =>
                set((s) => {
                    const favorites = { ...s.favorites };
                    if (favorites[app.id]) delete favorites[app.id];
                    else favorites[app.id] = snapshot(app);
                    return { favorites };
                }),

            markInstalled: (app, version) =>
                set((s) => ({
                    installed: {
                        ...s.installed,
                        [app.id]: {
                            app: snapshot(app),
                            version_id: version.id,
                            version_name: version.version_name,
                            version_code: version.version_code,
                            platform: version.platform,
                            file_format: version.file_format,
                            installed_at: new Date().toISOString(),
                        },
                    },
                    // Une app installée est suivie automatiquement (notifications activées par défaut)
                    followed: { ...s.followed, [app.id]: { app: snapshot(app), notify: s.followed[app.id]?.notify ?? true } },
                })),

            unmarkInstalled: (appId) =>
                set((s) => {
                    const installed = { ...s.installed };
                    delete installed[appId];
                    return { installed };
                }),

            setFollow: (app, follow) =>
                set((s) => {
                    const followed = { ...s.followed };
                    if (follow) followed[app.id] = { app: snapshot(app), notify: followed[app.id]?.notify ?? true };
                    else delete followed[app.id];
                    return { followed };
                }),

            setNotify: (appId, notify) =>
                set((s) =>
                    s.followed[appId] ? { followed: { ...s.followed, [appId]: { ...s.followed[appId], notify } } } : s,
                ),

            replaceAll: ({ favorites, installed, followed }) => set({ favorites, installed, followed }),
            // Instantanés remis à jour (langue de l'app, nom ou icône modifiés) ; les autres données restent inchangées
            refreshSnapshots: (apps) =>
                set((s) => {
                    const fresh = Object.fromEntries(apps.map((a) => [a.id, snapshot(a)]));
                    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
                    let changed = false;
                    const favorites = { ...s.favorites };
                    const installed = { ...s.installed };
                    const followed = { ...s.followed };
                    for (const [id, app] of Object.entries(fresh)) {
                        if (favorites[id] && !same(favorites[id], app)) (favorites[id] = app), (changed = true);
                        if (installed[id] && !same(installed[id].app, app)) (installed[id] = { ...installed[id], app }), (changed = true);
                        if (followed[id] && !same(followed[id].app, app)) (followed[id] = { ...followed[id], app }), (changed = true);
                    }
                    return changed ? { favorites, installed, followed } : s;
                }),
            clearFavorites: () => set({ favorites: {} }),
        }),
        { name: "kaskad.library", storage: persistStorage },
    ),
);
