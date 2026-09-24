import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "./storage";

export const useUpdatesStore = create(
    persist(
        (set) => ({
            // { [appId]: latest_version }
            available: {},
            // Dernière version pour laquelle une notification a été envoyée : { [appId]: version_code }
            notified: {},
            lastCheckedAt: null,
            setAvailable: (available) => set({ available, lastCheckedAt: new Date().toISOString() }),
            clear: (appId) =>
                set((s) => {
                    const available = { ...s.available };
                    delete available[appId];
                    return { available };
                }),
            markNotified: (appId, code) => set((s) => ({ notified: { ...s.notified, [appId]: code } })),
        }),
        { name: "kaskad.updates", storage: persistStorage },
    ),
);
