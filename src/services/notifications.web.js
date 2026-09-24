import { isElectron } from "@/lib/platform";
import { useSettingsStore } from "@/store/settings";

const supported = () => typeof window !== "undefined" && "Notification" in window;

export async function ensurePermission({ ask = true } = {}) {
    if (!supported()) return false;
    if (Notification.permission === "granted") return true;
    if (!ask || Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
}

let openHandler = null;

export async function notifyLocal({ title, body, data }) {
    if (!useSettingsStore.getState().notificationsEnabled) return;
    if (!(await ensurePermission())) return;
    const n = new Notification(title, { body, icon: "/favicon.ico" });
    n.onclick = () => {
        window.focus();
        openHandler?.(data ?? {});
    };
}

// Desktop : pas de push natif, les nouvelles versions sont détectées par vérification périodique
export async function getPushToken() {
    return null;
}

export async function setBadgeCount(count) {
    if (isElectron()) window.kaskad.setBadge(count);
}

export function addNotificationOpenListener(onOpen) {
    openHandler = onOpen;
    return () => {
        if (openHandler === onOpen) openHandler = null;
    };
}
