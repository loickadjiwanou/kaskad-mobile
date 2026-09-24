import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useSettingsStore } from "@/store/settings";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
    }),
});

let channelReady = false;
async function ensureChannel() {
    if (Platform.OS !== "android" || channelReady) return;
    await Notifications.setNotificationChannelAsync("default", {
        name: "Kaskad",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#2F6BFF",
    });
    channelReady = true;
}

export async function ensurePermission({ ask = true } = {}) {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || !ask || !current.canAskAgain) return current.granted;
    return (await Notifications.requestPermissionsAsync()).granted;
}

export async function notifyLocal({ title, body, data }) {
    if (!useSettingsStore.getState().notificationsEnabled) return;
    try {
        if (!(await ensurePermission())) return;
        await Notifications.scheduleNotificationAsync({ content: { title, body, data }, trigger: null });
    } catch {}
}

/** Jeton natif (FCM sur Android, APNs sur iOS) transmis au backend pour les notifications push. */
export async function getPushToken() {
    if (!Device.isDevice) return null;
    try {
        if (!(await ensurePermission())) return null;
        const token = await Notifications.getDevicePushTokenAsync();
        return { token: token.data, provider: token.type === "ios" ? "apns" : "fcm", platform: Platform.OS };
    } catch {
        // ex. Expo Go ou google-services.json absent : les notifications locales restent disponibles
        return null;
    }
}

export async function setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count).catch(() => {});
}

export function addNotificationOpenListener(onOpen) {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        onOpen(response.notification.request.content.data ?? {});
    });
    return () => sub.remove();
}
