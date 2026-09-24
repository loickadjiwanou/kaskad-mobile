import { StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { formatBytes, percent } from "@/lib/format";
import { useDownloadForVersion } from "@/lib/hooks";
import { formatLabel } from "@/lib/platform";
import {
    cancelDownload,
    downloadCapabilities,
    pauseDownload,
    restartDownload,
    resumeDownload,
    revealDownload,
    startDownload,
} from "@/services/downloads";
import { useProgressStore } from "@/store/progress";
import { useI18n } from "@/i18n";
import { font, spacing, useTheme } from "@/theme";
import Button from "./Button";
import IconButton from "./IconButton";
import ProgressBar from "./ProgressBar";

export function useDownloadProgress(item) {
    const live = useProgressStore((s) => (item ? s.byId[item.id] : null));
    const written = live?.written ?? item?.bytesWritten ?? 0;
    const total = live?.total || item?.size || 0;
    return { written, total, value: percent(written, total) };
}

export function DownloadProgress({ item, children }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const { written, total, value } = useDownloadProgress(item);
    const active = item.status === "downloading" || item.status === "queued";
    const label = {
        queued: tr("download.queued"),
        downloading: `${Math.round(value * 100)} %`,
        paused: tr(item.interrupted ? "download.interrupted" : "download.paused"),
        failed: tr("download.failed"),
    }[item.status];
    return (
        <View style={styles.progress}>
            <ProgressBar value={value} muted={!active} />
            <View style={styles.progressRow}>
                <Text style={[font.tiny, { color: item.status === "failed" ? t.danger : t.textSecondary, fontWeight: "700" }]}>
                    {label}
                </Text>
                <Text style={[font.tiny, { color: t.textSecondary }]}>
                    {formatBytes(written)} / {formatBytes(total)}
                </Text>
            </View>
            {item.status === "failed" && !!item.error && (
                <Text style={[font.tiny, { color: t.danger }]} numberOfLines={2}>
                    {item.error}
                </Text>
            )}
            {children}
        </View>
    );
}

/** Contrôles d'un téléchargement en cours / en pause / en échec. */
export function DownloadControls({ item }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const canResume = downloadCapabilities.resume && (item.resumeData || item.bytesWritten > 0);
    return (
        <View style={styles.controls}>
            {(item.status === "downloading" || item.status === "queued") && downloadCapabilities.pause && (
                <IconButton name="pause" onPress={() => pauseDownload(item.id)} label={tr("download.pause")} color={t.primary} />
            )}
            {item.status === "paused" && (
                <IconButton name="play" onPress={() => resumeDownload(item.id)} label={tr("download.resume")} color={t.primary} />
            )}
            {item.status === "failed" && (
                <>
                    {canResume && <IconButton name="play" onPress={() => resumeDownload(item.id)} label={tr("download.resume")} color={t.primary} />}
                    <IconButton name="restart" onPress={() => restartDownload(item.id)} label={tr("download.restart")} color={t.primary} />
                </>
            )}
            <IconButton name="close" onPress={() => cancelDownload(item.id)} label={tr("download.cancel")} color={t.textSecondary} />
        </View>
    );
}

/**
 * Bouton de téléchargement d'une version, reflétant l'état courant.
 * Le téléchargement enregistre le fichier sur l'appareil ; il ne lance jamais l'installation.
 */
export default function DownloadAction({ app, version, primary = false }) {
    const { t: tr } = useI18n();
    const item = useDownloadForVersion(version.id);
    const status = item?.status;

    if (!item || status === "canceled") {
        return (
            <Button
                title={primary ? tr("download.cta", { format: formatLabel(version.file_format), size: formatBytes(version.file_size) }) : tr("common.download")}
                icon="download"
                size={primary ? "md" : "sm"}
                variant={primary ? "primary" : "secondary"}
                full={primary}
                onPress={() => startDownload(app, version)}
            />
        );
    }

    if (status === "completed") {
        return (
            <View style={[styles.controls, primary && { alignSelf: "stretch" }]}>
                <Button
                    title={tr(item.handledByBrowser ? "download.sentToBrowser" : "download.done")}
                    icon="check-circle"
                    size={primary ? "md" : "sm"}
                    variant="secondary"
                    style={primary && { flex: 1 }}
                    onPress={() => revealDownload(item.id)}
                />
                <IconButton name="download" onPress={() => startDownload(app, version)} label={tr("download.again")} />
            </View>
        );
    }

    return (
        <View style={[styles.inline, primary && { alignSelf: "stretch" }]}>
            <View style={{ flex: 1 }}>
                <DownloadProgress item={item} />
            </View>
            <DownloadControls item={item} />
        </View>
    );
}

const styles = StyleSheet.create({
    progress: { gap: 4 },
    progressRow: { flexDirection: "row", justifyContent: "space-between" },
    controls: { flexDirection: "row", alignItems: "center", gap: 2 },
    inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minWidth: 220 },
});
