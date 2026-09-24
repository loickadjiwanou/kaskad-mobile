import { t } from "@/i18n";
import { showMessage } from "@/lib/dialog";
import { useSettingsStore } from "@/store/settings";
import { registerPushToken } from "./account";
import { ensurePermission } from "./notifications";

/**
 * Active les notifications (désactivées par défaut) : demande l'autorisation système,
 * active le réglage global et enregistre le jeton push. Retourne false si refusé.
 */
export async function enableNotifications() {
    if (!(await ensurePermission())) {
        showMessage(t("profile.notifBlockedTitle"), t("profile.notifBlockedMessage"));
        return false;
    }
    useSettingsStore.getState().setNotificationsEnabled(true);
    registerPushToken().catch(() => {});
    return true;
}
