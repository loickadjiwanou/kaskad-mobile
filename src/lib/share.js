import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { t } from "@/i18n";
import { toast } from "./dialog";

/**
 * Partage le lien public d'une app (page web qui ouvre l'app dans Kaskad quand Kaskad est installé).
 * Web / desktop : partage natif du navigateur quand il existe, sinon copie du lien.
 */
export async function shareApp(app) {
    const url = app.share_url ?? `kaskad://app/${app.id}`;
    if (Platform.OS === "web") {
        const isElectron = typeof window !== "undefined" && !!window.kaskad?.isElectron;
        if (!isElectron && typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({ title: app.name, text: app.short_description, url });
                return;
            } catch (e) {
                if (e?.name === "AbortError") return;
            }
        }
        await Clipboard.setStringAsync(url);
        toast(t("app.linkCopied"), { type: "success" });
        return;
    }
    // iOS : `url` donne l'aperçu du lien ; Android : le lien doit être dans le message
    await Share.share(Platform.OS === "ios" ? { url, message: app.name } : { title: app.name, message: `${app.name} — ${url}` }).catch(() => {});
}
