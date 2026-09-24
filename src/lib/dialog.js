// API des alertes et toasts. Tout passe par des composants maison (DialogHost / ToastHost) :
// aucune boîte de dialogue système (Alert natif, window.alert / window.confirm) n'est utilisée.
import { t } from "@/i18n";
import { useOverlayStore } from "@/store/overlays";

const open = (dialog) => new Promise((resolve) => useOverlayStore.getState().openDialog({ ...dialog, resolve }));

/** Alerte d'information avec un seul bouton. */
export function showMessage(title, message, { tone = "info" } = {}) {
    return open({
        title,
        message,
        tone,
        actions: [{ label: t("common.ok"), value: true, variant: "primary" }],
        cancelValue: true,
    });
}

/** Demande de confirmation. Résout true si confirmé, false sinon. */
export function confirm(title, message, { confirmText = t("common.confirm"), destructive = false } = {}) {
    return open({
        title,
        message,
        tone: destructive ? "danger" : "question",
        actions: [
            { label: t("common.cancel"), value: false, variant: "ghost" },
            { label: confirmText, value: true, variant: destructive ? "dangerSolid" : "primary" },
        ],
        cancelValue: false,
    });
}

/**
 * Choix parmi plusieurs actions : options = [{ label, value, destructive? }].
 * Résout la `value` choisie, ou null si annulé.
 */
export function choose(title, message, options) {
    return open({
        title,
        message,
        tone: options.some((o) => o.destructive) ? "danger" : "question",
        actions: [
            ...options.map((o) => ({ label: o.label, value: o.value, variant: o.destructive ? "dangerSolid" : "secondary" })),
            { label: t("common.cancel"), value: null, variant: "ghost" },
        ],
        cancelValue: null,
        stacked: true,
    });
}

/**
 * Toast éphémère : type = "success" | "error" | "info".
 * `action` optionnelle : { label, onPress } → bouton affiché dans le toast (reste visible plus longtemps).
 */
export function toast(message, { type = "info", duration, action } = {}) {
    duration ??= action ? 5000 : 2600;
    const store = useOverlayStore.getState();
    const id = store.pushToast({ message, type, action });
    setTimeout(() => useOverlayStore.getState().removeToast(id), duration);
    return id;
}
