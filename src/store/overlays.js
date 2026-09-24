import { create } from "zustand";

let nextId = 1;

// Alertes et toasts de l'app (composants maison, jamais les boîtes de dialogue système)
export const useOverlayStore = create((set, get) => ({
    // Alerte affichée : { id, title, message, icon, tone, actions: [{ label, value, variant }], cancelValue, resolve }
    dialog: null,
    queue: [],
    toasts: [], // [{ id, message, type }]

    openDialog: (dialog) => {
        const d = { ...dialog, id: nextId++ };
        if (get().dialog) set((s) => ({ queue: [...s.queue, d] }));
        else set({ dialog: d });
    },

    closeDialog: (value) => {
        const current = get().dialog;
        if (!current) return;
        const [next, ...rest] = get().queue;
        set({ dialog: next ?? null, queue: rest });
        current.resolve?.(value);
    },

    pushToast: (toast) => {
        const id = nextId++;
        // 3 toasts maximum à l'écran
        set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }));
        return id;
    },

    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
