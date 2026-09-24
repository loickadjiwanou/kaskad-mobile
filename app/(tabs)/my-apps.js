import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import AppRow from "@/components/AppRow";
import Grid from "@/components/Grid";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import SectionHeader from "@/components/SectionHeader";
import { EmptyState } from "@/components/States";
import { useI18n } from "@/i18n";
import { toast } from "@/lib/dialog";
import { formatDate } from "@/lib/format";
import { formatLabel, platformLabel } from "@/lib/platform";
import { startDownload } from "@/services/downloads";
import { enableNotifications } from "@/services/preferences";
import { checkForUpdates } from "@/services/updates";
import { useLibraryStore } from "@/store/library";
import { useSettingsStore } from "@/store/settings";
import { useUpdatesStore } from "@/store/updates";
import { font, radius, spacing, useTheme } from "@/theme";

function NotifyToggle({ appId, app }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const followed = useLibraryStore((s) => s.followed[appId]);
    const { setNotify, setFollow } = useLibraryStore.getState();
    const globalOn = useSettingsStore((s) => s.notificationsEnabled);
    // Une app n'est notifiée que si ses notifications ET le réglage global sont actifs
    const on = !!followed?.notify && globalOn;
    return (
        <IconButton
            name={on ? "bell-ring" : "bell-off-outline"}
            color={on ? t.primary : t.textMuted}
            label={tr(on ? "myApps.notifyOff" : "myApps.notifyOn")}
            onPress={async () => {
                if (!on && !useSettingsStore.getState().notificationsEnabled && !(await enableNotifications())) return;
                if (followed) setNotify(appId, !on);
                else setFollow(app, true);
            }}
        />
    );
}

export default function MyApps() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const installed = useLibraryStore((s) => s.installed);
    const followed = useLibraryStore((s) => s.followed);
    const available = useUpdatesStore((s) => s.available);
    const lastCheckedAt = useUpdatesStore((s) => s.lastCheckedAt);
    const [checking, setChecking] = useState(false);

    const installedList = Object.entries(installed).sort((a, b) => a[1].app.name.localeCompare(b[1].app.name, "fr"));
    const updates = installedList.filter(([id]) => available[id]);
    const followedOnly = Object.entries(followed).filter(([id]) => !installed[id]);

    const check = async () => {
        setChecking(true);
        try {
            const found = Object.keys(await checkForUpdates()).length;
            toast(found ? tr("myApps.updatesFound", { count: found }) : tr("myApps.allUpToDate"), { type: found ? "info" : "success" });
        } catch (e) {
            toast(`${tr("myApps.checkFailed")} : ${e.message}`, { type: "error" });
        } finally {
            setChecking(false);
        }
    };

    if (!installedList.length && !followedOnly.length) {
        return (
            <Screen>
                <ScreenHeader title={tr("myApps.title")} />
                <EmptyState
                    icon="view-grid-plus-outline"
                    title={tr("myApps.emptyTitle")}
                    message={tr("myApps.emptyMessage")}
                    action={<Button title={tr("common.explore")} icon="compass-outline" onPress={() => router.navigate("/")} />}
                />
            </Screen>
        );
    }

    return (
        <Screen onRefresh={check} refreshing={checking}>
            <ScreenHeader
                title={tr("myApps.title")}
                subtitle={lastCheckedAt ? tr("myApps.lastCheck", { date: formatDate(lastCheckedAt, true) }) : undefined}
                right={
                    <Button title={tr("myApps.check")} icon="refresh" size="sm" variant="secondary" loading={checking} onPress={check} />
                }
            />

            {updates.length > 0 && (
                <>
                    <SectionHeader title={tr("myApps.updatesTitle", { count: updates.length })} />
                    <View style={[styles.updatesBox, { backgroundColor: t.primarySoft }]}>
                        <Text style={[font.small, { color: t.text }]}>{tr("myApps.updatesHint")}</Text>
                    </View>
                    <Grid max={3}>
                        {updates.map(([id, info]) => {
                            const v = available[id];
                            return (
                                <AppRow
                                    key={id}
                                    app={info.app}
                                    subtitle={`v${info.version_name} → v${v.version_name} · ${platformLabel(v.platform)} ${formatLabel(v.file_format)}`}
                                    right={
                                        <Button
                                            title={tr("common.download")}
                                            icon="download"
                                            size="sm"
                                            onPress={() => startDownload(info.app, v)}
                                        />
                                    }
                                />
                            );
                        })}
                    </Grid>
                </>
            )}

            {installedList.length > 0 && (
                <>
                    <SectionHeader title={tr("myApps.installed")} />
                    <Grid max={3}>
                        {installedList.map(([id, info]) => (
                            <AppRow
                                key={id}
                                app={info.app}
                                subtitle={`v${info.version_name} · ${platformLabel(info.platform)} ${formatLabel(info.file_format)}${` · ${tr(available[id] ? "myApps.updateAvailable" : "myApps.upToDate")}`}`}
                                right={<NotifyToggle appId={id} app={info.app} />}
                            />
                        ))}
                    </Grid>
                </>
            )}

            {followedOnly.length > 0 && (
                <>
                    <SectionHeader title={tr("myApps.followed")} />
                    <Grid max={3}>
                        {followedOnly.map(([id, info]) => (
                            <AppRow
                                key={id}
                                app={info.app}
                                subtitle={tr("myApps.notInstalled")}
                                right={<NotifyToggle appId={id} app={info.app} />}
                            />
                        ))}
                    </Grid>
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    updatesBox: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
});
