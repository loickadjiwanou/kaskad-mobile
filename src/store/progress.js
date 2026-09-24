import { create } from "zustand";

// Progression en temps réel (non persistée pour éviter d'écrire sur le disque à chaque mise à jour)
export const useProgressStore = create((set) => ({
    byId: {},
    set: (id, written, total) => set((s) => ({ byId: { ...s.byId, [id]: { written, total } } })),
    clear: (id) =>
        set((s) => {
            const byId = { ...s.byId };
            delete byId[id];
            return { byId };
        }),
}));
