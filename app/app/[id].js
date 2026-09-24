import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { Text } from "@/components/Text";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "@/api";
import AppIcon from "@/components/AppIcon";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import DownloadAction from "@/components/DownloadAction";
import Gallery from "@/components/Gallery";
import HashBox from "@/components/HashBox";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import { FormatBadge, PlatformIcons } from "@/components/PlatformBadges";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import SectionHeader from "@/components/SectionHeader";
import { ErrorState, Loading } from "@/components/States";
import { useI18n } from "@/i18n";
import { confirm, toast } from "@/lib/dialog";
import { formatBytes, formatCount, formatDate } from "@/lib/format";
import { useDownloadForVersion, useIsWide } from "@/lib/hooks";
import { bestVersionForDevice, detectPlatform, formatLabel, platformLabel, sortVersionsForDevice } from "@/lib/platform";
import { useAsync } from "@/lib/useAsync";
import { enableNotifications } from "@/services/preferences";
import { markAppInstalled, unmarkAppInstalled } from "@/services/updates";
import { useLibraryStore } from "@/store/library";
import { useSettingsStore } from "@/store/settings";
import { useUpdatesStore } from "@/store/updates";
import { font, radius, spacing, useTheme } from "@/theme";

function faqSectionFor(platform) {
    return { android: "android", windows: "windows", macos: "macos", linux: "linux" }[platform] ?? "integrity";
}

/** Encadré principal : meilleure version pour l'appareil + étape "marquer comme installée". */
function PrimaryDownload({ app, version }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const item = useDownloadForVersion(version?.id);
    const installed = useLibraryStore((s) => s.installed[app.id]);
    const { target } = detectPlatform();

    if (!version) {
        return (
            <Card style={styles.primaryCard}>
                <View style={styles.noteRow}>
                    <Icon name="information-outline" size={20} color={t.info} />
                    <Text style={[font.small, { color: t.text, flex: 1 }]}>
                        {target ? tr("app.noVersionFor", { platform: platformLabel(target) }) : tr("app.noVersionDevice")}
                    </Text>
                </View>
            </Card>
        );
    }

    const isInstalled = installed?.version_id === version.id || (installed && installed.version_code >= version.version_code);
    return (
        <Card style={styles.primaryCard}>
            <View style={styles.primaryHead}>
                <FormatBadge platform={version.platform} format={version.file_format} highlight />
                <Text style={[font.small, { color: t.textSecondary }]}>
                    v{version.version_name} · {formatBytes(version.file_size)}
                </Text>
            </View>
            <DownloadAction app={app} version={version} primary />
            {item?.status === "completed" && !isInstalled && (
                <View style={[styles.installHint, { borderColor: t.border }]}>
                    <Text style={[font.small, { color: t.text }]}>{tr("app.fileReady")}</Text>
                    <View style={styles.row}>
                        <Button title={tr("app.iInstalled")} icon="check" size="sm" onPress={() => markAppInstalled(app, version)} />
                        <Button
                            title={tr("app.howToInstall")}
                            icon="help-circle-outline"
                            size="sm"
                            variant="ghost"
                            onPress={() => router.push({ pathname: "/faq", params: { section: faqSectionFor(version.platform) } })}
                        />
                    </View>
                </View>
            )}
            <Text style={[font.tiny, { color: t.textMuted }]}>{tr("app.manualOnly")}</Text>
        </Card>
    );
}

function LibraryPanel({ app, latestForDevice }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const globalNotify = useSettingsStore((s) => s.notificationsEnabled);
    const installed = useLibraryStore((s) => s.installed[app.id]);
    const followed = useLibraryStore((s) => s.followed[app.id]);
    const { setFollow, setNotify } = useLibraryStore.getState();
    const update = useUpdatesStore((s) => s.available[app.id]);

    const unmark = async () => {
        if (
            await confirm(tr("app.removeTitle"), tr("app.removeMessage", { name: app.name }), {
                confirmText: tr("app.remove"),
                destructive: true,
            })
        )
            unmarkAppInstalled(app.id);
    };

    // Une app n'est notifiée que si ses notifications ET le réglage global sont actifs
    const notifyOn = !!followed?.notify && globalNotify;
    const toggleNotify = async (v) => {
        if (v && !globalNotify && !(await enableNotifications())) return;
        if (followed) setNotify(app.id, v);
        else if (v) setFollow(app, true);
    };

    return (
        <Card style={styles.libraryCard} padded={false}>
            {installed ? (
                <View style={styles.libRow}>
                    <Icon name="check-decagram" size={22} color={t.success} />
                    <View style={{ flex: 1 }}>
                        <Text style={[font.body, { color: t.text, fontWeight: "700" }]}>
                            {tr("app.installedVersion", { version: installed.version_name })}
                        </Text>
                        <Text style={[font.small, { color: update ? t.warning : t.textSecondary }]}>
                            {update
                                ? tr("app.newVersion", { version: update.version_name })
                                : `${platformLabel(installed.platform)} · ${formatLabel(installed.file_format)}`}
                        </Text>
                    </View>
                    <Button title={tr("app.remove")} size="sm" variant="ghost" onPress={unmark} />
                </View>
            ) : (
                <View style={styles.libRow}>
                    <Icon name="package-variant-closed" size={22} color={t.textSecondary} />
                    <View style={{ flex: 1 }}>
                        <Text style={[font.body, { color: t.text, fontWeight: "700" }]}>{tr("app.notInLibrary")}</Text>
                        <Text style={[font.small, { color: t.textSecondary }]}>{tr("app.notInLibraryMessage")}</Text>
                    </View>
                    {latestForDevice && (
                        <Button
                            title={tr("app.markInstalled")}
                            icon="plus"
                            size="sm"
                            variant="secondary"
                            onPress={() => markAppInstalled(app, latestForDevice)}
                        />
                    )}
                </View>
            )}
            <View style={[styles.divider, { backgroundColor: t.border }]} />
            <View style={styles.libRow}>
                <Icon name={notifyOn ? "bell-ring-outline" : "bell-outline"} size={22} color={t.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={[font.body, { color: t.text, fontWeight: "700" }]}>{tr("app.notifyTitle")}</Text>
                    <Text style={[font.small, { color: t.textSecondary }]}>{tr("app.notifyMessage")}</Text>
                </View>
                <Switch value={notifyOn} onValueChange={toggleNotify} trackColor={{ true: t.primary, false: t.surfaceAlt }} />
            </View>
        </Card>
    );
}

function VersionGroup({ app, group, expanded, onToggle }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const { target } = detectPlatform();
    return (
        <Card style={styles.versionCard} padded={false}>
            <Pressable onPress={onToggle} style={styles.versionHead} accessibilityRole="button" accessibilityState={{ expanded }}>
                <View style={{ flex: 1 }}>
                    <Text style={[font.h3, { color: t.text }]}>{tr("app.version", { version: group.version_name })}</Text>
                    <Text style={[font.small, { color: t.textSecondary }]}>
                        {tr("app.publishedOn", { date: formatDate(group.published_at) })} · {tr("app.files", { count: group.files.length })}
                    </Text>
                </View>
                <Icon name={expanded ? "chevron-up" : "chevron-down"} size={22} color={t.textSecondary} />
            </Pressable>
            {expanded && (
                <View style={styles.versionBody}>
                    {!!group.changelog && (
                        <View style={{ gap: 4 }}>
                            <Text style={[font.tiny, styles.label, { color: t.textSecondary }]}>{tr("app.whatsNew")}</Text>
                            <Text style={[font.body, { color: t.text }]}>{group.changelog}</Text>
                        </View>
                    )}
                    {group.files.map((v) => (
                        <View key={v.id} style={[styles.file, { borderColor: v.platform === target ? t.primary : t.border }]}>
                            <View style={styles.fileHead}>
                                <FormatBadge platform={v.platform} format={v.file_format} highlight={v.platform === target} />
                                <Text style={[font.small, { color: t.textSecondary }]}>{formatBytes(v.file_size)}</Text>
                            </View>
                            <HashBox hash={v.sha256_hash} />
                            <View style={{ alignItems: "flex-end" }}>
                                <DownloadAction app={app} version={v} />
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </Card>
    );
}

export default function AppDetail() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const wide = useIsWide();
    const { id } = useLocalSearchParams();
    const { data: app, error, loading, reload, refresh, refreshing } = useAsync(() => api.getApp(id), [id]);
    const isFavorite = useLibraryStore((s) => !!s.favorites[id]);
    const [showMore, setShowMore] = useState(false);
    const [openGroups, setOpenGroups] = useState({});

    const best = useMemo(() => (app ? bestVersionForDevice(app.versions) : null), [app]);

    const groups = useMemo(() => {
        if (!app) return [];
        const map = new Map();
        sortVersionsForDevice(app.versions).forEach((v) => {
            if (!map.has(v.version_code))
                map.set(v.version_code, {
                    version_code: v.version_code,
                    version_name: v.version_name,
                    published_at: v.published_at,
                    changelog: v.changelog,
                    files: [],
                });
            map.get(v.version_code).files.push(v);
        });
        return [...map.values()].sort((a, b) => b.version_code - a.version_code);
    }, [app]);

    if (loading || error) {
        return (
            <Screen scroll={false}>
                <ScreenHeader back large={false} title="" />
                {loading ? <Loading /> : <ErrorState error={error} onRetry={reload} />}
            </Screen>
        );
    }

    const longText = app.long_description ?? "";
    const truncated = !showMore && longText.length > 260;

    return (
        <Screen onRefresh={refresh} refreshing={refreshing}>
            <ScreenHeader
                back
                large={false}
                title=""
                right={
                    <IconButton
                        name={isFavorite ? "heart" : "heart-outline"}
                        color={isFavorite ? t.danger : t.text}
                        onPress={() => {
                            useLibraryStore.getState().toggleFavorite(app);
                            toast(tr(isFavorite ? "app.favoriteRemoved" : "app.favoriteAdded"), { type: isFavorite ? "info" : "success" });
                        }}
                        label={tr(isFavorite ? "app.removeFavorite" : "app.addFavorite")}
                    />
                }
            />

            <View style={[styles.top, wide && styles.topWide]}>
                <View style={styles.identity}>
                    <AppIcon app={app} size={wide ? 112 : 88} />
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[font.h1, { color: t.text }]}>{app.name}</Text>
                        <Text style={[font.body, { color: t.textSecondary }]}>{app.short_description}</Text>
                        <View style={styles.metaRow}>
                            <PlatformIcons platforms={app.platforms} size={16} />
                            <Text style={[font.small, { color: t.textMuted }]}>
                                · {tr("app.downloadsCount", { count: formatCount(app.downloads_count) })} ·{" "}
                                {tr("app.updated", { date: formatDate(app.updated_at) })}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.primaryCol, wide && { width: 380 }]}>
                    <PrimaryDownload app={app} version={best} />
                </View>
            </View>

            {!!app.categories?.length && (
                <View style={styles.chips}>
                    {app.categories.map((c) => (
                        <Chip key={c.id} label={c.name} icon={c.icon} onPress={() => router.push(`/category/${c.id}`)} />
                    ))}
                </View>
            )}

            <View style={styles.section}>
                <LibraryPanel app={app} latestForDevice={best} />
            </View>

            {!!app.screenshots?.length && (
                <>
                    <SectionHeader title={tr("app.preview")} />
                    <Gallery screenshots={app.screenshots} />
                </>
            )}

            <SectionHeader title={tr("app.about")} />
            <View style={styles.section}>
                <Text style={[font.body, { color: t.text }]}>{truncated ? `${longText.slice(0, 260).trim()}…` : longText}</Text>
                {longText.length > 260 && (
                    <Pressable onPress={() => setShowMore(!showMore)} hitSlop={8}>
                        <Text style={{ color: t.primary, fontWeight: "700", marginTop: spacing.sm }}>
                            {tr(showMore ? "app.readLess" : "app.readMore")}
                        </Text>
                    </Pressable>
                )}
            </View>

            <SectionHeader title={tr("app.versions")} />
            <View style={[styles.section, { gap: spacing.md }]}>
                <View style={[styles.noteRow, styles.securityNote, { backgroundColor: t.surfaceAlt }]}>
                    <Icon name="shield-check-outline" size={18} color={t.success} />
                    <Text style={[font.small, { color: t.textSecondary, flex: 1 }]}>
                        {tr("app.securityNote")}{" "}
                        <Text
                            style={{ color: t.primary, fontWeight: "700" }}
                            onPress={() => router.push({ pathname: "/faq", params: { section: "integrity" } })}
                        >
                            {tr("app.learnMore")}
                        </Text>
                    </Text>
                </View>
                {groups.map((g, i) => (
                    <VersionGroup
                        key={g.version_code}
                        app={app}
                        group={g}
                        expanded={openGroups[g.version_code] ?? i === 0}
                        onToggle={() => setOpenGroups((s) => ({ ...s, [g.version_code]: !(s[g.version_code] ?? i === 0) }))}
                    />
                ))}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    top: { paddingHorizontal: spacing.lg, gap: spacing.lg },
    topWide: { flexDirection: "row", alignItems: "flex-start" },
    identity: { flexDirection: "row", gap: spacing.lg, flex: 1, alignItems: "center" },
    primaryCol: { gap: spacing.md },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 },
    primaryCard: { gap: spacing.md },
    primaryHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, flexWrap: "wrap" },
    installHint: { gap: spacing.sm, borderTopWidth: 1, paddingTop: spacing.md },
    row: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
    noteRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
    securityNote: { padding: spacing.md, borderRadius: radius.md },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
    section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
    libraryCard: {},
    libRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
    divider: { height: 1, marginHorizontal: spacing.lg },
    versionCard: {},
    versionHead: { flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.md },
    versionBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
    label: { fontWeight: "800", letterSpacing: 0.8 },
    file: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
    fileHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
});
