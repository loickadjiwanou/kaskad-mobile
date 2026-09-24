import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import AppIcon from "@/components/AppIcon";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { DownloadControls, DownloadProgress } from "@/components/DownloadAction";
import Grid from "@/components/Grid";
import HashBox from "@/components/HashBox";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import { FormatBadge } from "@/components/PlatformBadges";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import SectionHeader from "@/components/SectionHeader";
import { EmptyState } from "@/components/States";
import { useI18n } from "@/i18n";
import { choose, confirm, showMessage, toast } from "@/lib/dialog";
import { formatBytes, formatDate } from "@/lib/format";
import { isElectron } from "@/lib/platform";
import { locationLabel, removeDownload, revealDownload, saveDownloadToDevice, shareDownload, verifyDownload } from "@/services/downloads";
import { markAppInstalled } from "@/services/updates";
import { ACTIVE_STATUSES, useDownloadsStore } from "@/store/downloads";
import { useLibraryStore } from "@/store/library";
import { font, spacing, useTheme } from "@/theme";

const canVerifyLocally = Platform.OS !== "web" || isElectron();

function CompletedActions({ item }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const [verifying, setVerifying] = useState(false);
    const installed = useLibraryStore((s) => s.installed[item.appId]);
    const isInstalled = installed && installed.version_code >= item.versionCode;

    const verify = async () => {
        setVerifying(true);
        try {
            const { verified } = await verifyDownload(item.id);
            // Empreinte identique : simple confirmation ; différente : alerte bloquante
            if (verified) toast(tr("downloads.verifyOkMessage"), { type: "success" });
            else showMessage(tr("downloads.verifyBadTitle"), tr("downloads.verifyBadMessage"), { tone: "danger" });
        } catch (e) {
            toast(`${tr("downloads.verifyFailed")} : ${e.message}`, { type: "error" });
        } finally {
            setVerifying(false);
        }
    };

    const markInstalled = () =>
        markAppInstalled(
            { id: item.appId, name: item.appName, icon_url: item.appIcon },
            {
                id: item.versionId,
                version_name: item.versionName,
                version_code: item.versionCode,
                platform: item.platform,
                file_format: item.format,
            },
        );

    return (
        <View style={{ gap: spacing.sm }}>
            {item.verified != null && (
                <View style={styles.verified}>
                    <Icon name={item.verified ? "shield-check" : "shield-alert"} size={16} color={item.verified ? t.success : t.danger} />
                    <Text style={[font.small, { color: item.verified ? t.success : t.danger, fontWeight: "700" }]}>
                        {tr(item.verified ? "downloads.verifiedOk" : "downloads.verifiedBad")}
                    </Text>
                </View>
            )}
            {!item.handledByBrowser && (
                <Text style={[font.tiny, { color: t.textMuted }]} numberOfLines={2}>
                    {tr("downloads.location", { location: locationLabel(item) })}
                </Text>
            )}
            <View style={styles.actions}>
                {canVerifyLocally && !item.handledByBrowser && (
                    <Button
                        title={tr("downloads.verify")}
                        icon="shield-search"
                        size="sm"
                        variant="secondary"
                        loading={verifying}
                        onPress={verify}
                    />
                )}
                {isElectron() && (
                    <Button
                        title={tr("downloads.reveal")}
                        icon="folder-open-outline"
                        size="sm"
                        variant="ghost"
                        onPress={() => revealDownload(item.id)}
                    />
                )}
                {Platform.OS !== "web" && (
                    <Button
                        title={tr("downloads.share")}
                        icon="share-variant-outline"
                        size="sm"
                        variant="ghost"
                        onPress={() => shareDownload(item.id)}
                    />
                )}
                {Platform.OS === "android" && !item.savedUri && (
                    <Button
                        title={tr("downloads.saveToDownloads")}
                        icon="folder-download-outline"
                        size="sm"
                        variant="ghost"
                        onPress={() =>
                            saveDownloadToDevice(item.id).catch((e) =>
                                toast(`${tr("downloads.saveFailed")} : ${e.message}`, { type: "error" }),
                            )
                        }
                    />
                )}
                {!isInstalled && (
                    <Button title={tr("downloads.markInstalled")} icon="check" size="sm" variant="ghost" onPress={markInstalled} />
                )}
            </View>
        </View>
    );
}

function DownloadCard({ item }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const active = ACTIVE_STATUSES.includes(item.status) || item.status === "paused" || item.status === "failed";

    const remove = async () => {
        if (item.status !== "completed" || item.handledByBrowser || !item.localUri) {
            removeDownload(item.id);
            return;
        }
        const choice = await choose(
            tr("downloads.removeTitle"),
            tr(Platform.OS === "android" && item.savedUri ? "downloads.removeMessageSaved" : "downloads.removeMessage"),
            [
                { label: tr("downloads.removeFile"), value: "file", destructive: true },
                { label: tr("downloads.removeHistoryOnly"), value: "history" },
            ],
        );
        if (!choice) return;
        const deleteFile = choice === "file";
        removeDownload(item.id, { deleteFile });
    };

    return (
        <Card style={styles.card}>
            <View style={styles.head}>
                <AppIcon app={{ id: item.appId, name: item.appName, icon_url: item.appIcon }} size={44} />
                <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[font.h3, { color: t.text }]} numberOfLines={1} onPress={() => router.push(`/app/${item.appId}`)}>
                        {item.appName} <Text style={{ color: t.textSecondary, fontWeight: "500" }}>v{item.versionName}</Text>
                    </Text>
                    <View style={styles.meta}>
                        <FormatBadge platform={item.platform} format={item.format} />
                        <Text style={[font.tiny, { color: t.textMuted }]}>
                            {formatBytes(item.size)} · {formatDate(item.completedAt ?? item.createdAt, true)}
                        </Text>
                    </View>
                </View>
                {!ACTIVE_STATUSES.includes(item.status) && (
                    <IconButton name="delete-outline" color={t.textMuted} onPress={remove} label={tr("downloads.removeTitle")} />
                )}
            </View>

            {active && (
                <View style={styles.inline}>
                    <View style={{ flex: 1 }}>
                        <DownloadProgress item={item} />
                    </View>
                    <DownloadControls item={item} />
                </View>
            )}
            {item.status === "completed" && <CompletedActions item={item} />}
            {item.status === "canceled" && <Text style={[font.small, { color: t.textMuted }]}>{tr("downloads.canceled")}</Text>}
            {(item.status === "completed" || item.verified === false) && !!item.sha256 && (
                <HashBox hash={item.sha256} label={tr("downloads.publishedHash")} />
            )}
        </Card>
    );
}

export default function Downloads() {
    const { t: tr } = useI18n();
    const items = useDownloadsStore((s) => s.items);
    const clearFinished = useDownloadsStore((s) => s.clearFinished);
    const inProgress = items.filter((it) => [...ACTIVE_STATUSES, "paused", "failed"].includes(it.status));
    const history = items.filter((it) => !inProgress.includes(it));

    if (!items.length) {
        return (
            <Screen>
                <ScreenHeader title={tr("downloads.title")} />
                <EmptyState icon="download-circle-outline" title={tr("downloads.emptyTitle")} message={tr("downloads.emptyMessage")} />
            </Screen>
        );
    }

    return (
        <Screen>
            <ScreenHeader
                title={tr("downloads.title")}
                right={
                    history.length > 0 && (
                        <IconButton
                            name="broom"
                            label={tr("downloads.clearHistory")}
                            onPress={async () =>
                                (await confirm(tr("downloads.clearTitle"), tr("downloads.clearMessage"), {
                                    destructive: true,
                                    confirmText: tr("downloads.clearHistory"),
                                })) && clearFinished()
                            }
                        />
                    )
                }
            />
            {inProgress.length > 0 && (
                <>
                    <SectionHeader title={tr("downloads.inProgress")} />
                    <Grid max={3} gap={spacing.md} padded>
                        {inProgress.map((it) => (
                            <DownloadCard key={it.id} item={it} />
                        ))}
                    </Grid>
                </>
            )}
            {history.length > 0 && (
                <>
                    <SectionHeader title={tr("downloads.history")} />
                    <Grid max={3} gap={spacing.md} padded>
                        {history.map((it) => (
                            <DownloadCard key={it.id} item={it} />
                        ))}
                    </Grid>
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    list: { paddingHorizontal: spacing.lg, gap: spacing.md },
    card: { gap: spacing.md },
    head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
    inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    verified: { flexDirection: "row", alignItems: "center", gap: 6 },
});
