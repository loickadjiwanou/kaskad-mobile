import { Platform, StyleSheet, Switch, View } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { USE_MOCK } from "@/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import Icon from "@/components/Icon";
import ListItem from "@/components/ListItem";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import SectionHeader from "@/components/SectionHeader";
import { LANGUAGE_NAMES, LANGUAGES, useI18n } from "@/i18n";
import { confirm, toast } from "@/lib/dialog";
import { detectPlatform, formatLabel, platformLabel } from "@/lib/platform";
import { deleteAccount, logout, unregisterPushToken } from "@/services/account";
import { enableNotifications } from "@/services/preferences";
import { useAuthStore } from "@/store/auth";
import { useLibraryStore } from "@/store/library";
import { useSettingsStore } from "@/store/settings";
import { font, radius, spacing, useTheme } from "@/theme";

const THEMES = [
    { id: "system", icon: "theme-light-dark" },
    { id: "light", icon: "white-balance-sunny" },
    { id: "dark", icon: "weather-night" },
    { id: "black", icon: "circle" },
];

function AccountCard() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const user = useAuthStore((s) => s.user);

    if (!user) {
        return (
            <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                <Text style={[font.h2, { color: "#fff" }]}>{tr("profile.heroTitle")}</Text>
                <Text style={{ color: "rgba(255,255,255,0.9)", lineHeight: 20 }}>{tr("profile.heroMessage")}</Text>
                <View style={styles.heroCta}>
                    <Text style={styles.heroCtaText} onPress={() => router.push("/auth")}>
                        {tr("profile.signIn")}
                    </Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <Card style={styles.account}>
            <View style={[styles.avatar, { backgroundColor: t.primarySoft }]}>
                <Icon name={user.anonymous ? "incognito" : "account"} size={28} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[font.h3, { color: t.text }]} numberOfLines={1}>
                    {user.anonymous ? tr("profile.anonymous") : user.email}
                </Text>
                <Text style={[font.small, { color: t.textSecondary }]}>
                    {tr(user.anonymous ? "profile.linkedDevice" : "profile.syncOn")}
                </Text>
            </View>
            {user.anonymous && <Button title={tr("profile.addEmail")} size="sm" variant="secondary" onPress={() => router.push("/auth")} />}
        </Card>
    );
}

export default function Profile() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const user = useAuthStore((s) => s.user);
    const favoritesCount = useLibraryStore((s) => Object.keys(s.favorites).length);
    const installedCount = useLibraryStore((s) => Object.keys(s.installed).length);
    const {
        themeMode,
        setThemeMode,
        language,
        setLanguage,
        notificationsEnabled,
        setNotificationsEnabled,
        androidDownloadDirUri,
        setAndroidDownloadDirUri,
    } = useSettingsStore();
    const device = detectPlatform();

    const toggleNotifications = (value) => {
        if (value) return enableNotifications();
        setNotificationsEnabled(false);
        // Le serveur n'envoie plus de notifications à cet appareil
        unregisterPushToken().catch(() => {});
    };

    const doLogout = async () => {
        if (
            !(await confirm(tr("profile.logoutTitle"), tr("profile.logoutMessage"), {
                confirmText: tr("profile.logout"),
                destructive: true,
            }))
        )
            return;
        await logout();
        toast(tr("profile.loggedOut"));
    };

    const doDeleteAccount = async () => {
        if (
            !(await confirm(tr("profile.deleteTitle"), tr("profile.deleteMessage"), {
                confirmText: tr("profile.deleteAccount"),
                destructive: true,
            }))
        )
            return;
        try {
            await deleteAccount();
            toast(tr("profile.deleted"), { type: "success" });
        } catch (e) {
            toast(`${tr("profile.deleteFailed")} : ${e.message}`, { type: "error" });
        }
    };

    return (
        <Screen>
            <ScreenHeader title={tr("profile.title")} />
            <View style={styles.pad}>
                <AccountCard />
            </View>

            <SectionHeader title={tr("profile.library")} />
            <Card padded={false} style={styles.mx}>
                <ListItem
                    icon="heart-outline"
                    title={tr("profile.favorites")}
                    subtitle={tr("common.apps", { count: favoritesCount })}
                    onPress={() => router.push("/favorites")}
                />
                <ListItem
                    icon="view-grid-outline"
                    title={tr("profile.myApps")}
                    subtitle={tr("profile.installed", { count: installedCount })}
                    onPress={() => router.navigate("/my-apps")}
                />
                <ListItem icon="download-outline" title={tr("profile.history")} onPress={() => router.navigate("/downloads")} />
            </Card>

            <SectionHeader title={tr("profile.help")} />
            <Card padded={false} style={styles.mx}>
                <ListItem
                    icon="book-open-page-variant-outline"
                    title={tr("profile.installApp")}
                    subtitle={tr("profile.installAppSub")}
                    onPress={() => router.push("/faq")}
                />
                <ListItem
                    icon="shield-check-outline"
                    title={tr("profile.verifyFile")}
                    subtitle={tr("profile.verifyFileSub")}
                    onPress={() => router.push({ pathname: "/faq", params: { section: "integrity" } })}
                />
            </Card>

            <SectionHeader title={tr("profile.preferences")} />
            <Card padded={false} style={styles.mx}>
                <ListItem
                    icon="bell-outline"
                    title={tr("profile.notifications")}
                    subtitle={tr("profile.notificationsSub")}
                    right={
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ true: t.primary, false: t.surfaceAlt }}
                        />
                    }
                />
                <View style={styles.choiceRow}>
                    <Text style={[font.body, { color: t.text, fontWeight: "600" }]}>{tr("profile.appearance")}</Text>
                    <View style={styles.chips}>
                        {THEMES.map((th) => (
                            <Chip
                                key={th.id}
                                label={tr(`profile.themes.${th.id}`)}
                                icon={th.icon}
                                selected={themeMode === th.id}
                                onPress={() => setThemeMode(th.id)}
                            />
                        ))}
                    </View>
                </View>
                <View style={styles.choiceRow}>
                    <Text style={[font.body, { color: t.text, fontWeight: "600" }]}>{tr("profile.language")}</Text>
                    <View style={styles.chips}>
                        {LANGUAGES.map((lang) => (
                            <Chip
                                key={lang}
                                label={lang === "system" ? tr("profile.systemLanguage") : LANGUAGE_NAMES[lang]}
                                icon={lang === "system" ? "cellphone-cog" : "translate"}
                                selected={language === lang}
                                onPress={() => setLanguage(lang)}
                            />
                        ))}
                    </View>
                </View>
                {Platform.OS === "android" && (
                    <ListItem
                        icon="folder-download-outline"
                        title={tr("profile.downloadFolder")}
                        subtitle={
                            androidDownloadDirUri
                                ? decodeURIComponent(androidDownloadDirUri.split("/").pop() ?? "")
                                : tr("profile.downloadFolderAsk")
                        }
                        right={
                            androidDownloadDirUri ? (
                                <Button
                                    title={tr("profile.change")}
                                    size="sm"
                                    variant="ghost"
                                    onPress={() => setAndroidDownloadDirUri(null)}
                                />
                            ) : null
                        }
                    />
                )}
            </Card>

            <SectionHeader title={tr("profile.about")} />
            <Card padded={false} style={styles.mx}>
                <ListItem
                    icon="cellphone-link"
                    title={tr("profile.device")}
                    subtitle={
                        device.target
                            ? tr("profile.deviceSub", {
                                  platform: platformLabel(device.target),
                                  formats: device.preferredFormats.map(formatLabel).join(", "),
                              })
                            : tr("profile.deviceNone")
                    }
                />
                <ListItem
                    icon="information-outline"
                    title={tr("profile.version")}
                    subtitle={`Kaskad ${Constants.expoConfig?.version ?? ""}${USE_MOCK ? ` · ${tr("profile.demo")}` : ""}`}
                />
                {user && <ListItem icon="logout" title={tr("profile.logout")} danger onPress={doLogout} chevron={false} />}
                {user && (
                    <ListItem
                        icon="account-remove-outline"
                        title={tr("profile.deleteAccount")}
                        danger
                        onPress={doDeleteAccount}
                        chevron={false}
                    />
                )}
            </Card>
        </Screen>
    );
}

const styles = StyleSheet.create({
    pad: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
    mx: { marginHorizontal: spacing.lg },
    hero: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm },
    heroCta: {
        backgroundColor: "#fff",
        alignSelf: "flex-start",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: radius.pill,
        marginTop: spacing.sm,
    },
    heroCtaText: { color: "#1E4FD6", fontWeight: "800" },
    account: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
    choiceRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
