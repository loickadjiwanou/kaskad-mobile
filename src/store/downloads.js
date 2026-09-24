import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "./storage";

// status: "queued" | "downloading" | "paused" | "completed" | "failed" | "canceled"
export const ACTIVE_STATUSES = ["queued", "downloading"];

export const useDownloadsStore = create(
    persist(
        (set, get) => ({
            items: [],
            add: (item) => set((s) => ({ items: [item, ...s.items] })),
            update: (id, patch) =>
                set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),
            remove: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
            clearFinished: () =>
                set((s) => ({ items: s.items.filter((it) => !["completed", "failed", "canceled"].includes(it.status)) })),
            get: (id) => get().items.find((it) => it.id === id),
        }),
        {
            name: "kaskad.downloads",
            storage: persistStorage,
            // Un téléchargement "en cours" au redémarrage a été interrompu : on le met en pause (reprise possible)
            onRehydrateStorage: () => (state) => {
                state?.items.forEach((it) => {
                    if (ACTIVE_STATUSES.includes(it.status)) state.update(it.id, { status: "paused", interrupted: true });
                });
            },
        },
    ),
);
