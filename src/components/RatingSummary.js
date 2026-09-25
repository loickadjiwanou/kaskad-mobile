import { StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { useI18n } from "@/i18n";
import { formatCount } from "@/lib/format";
import { font, radius, spacing, useTheme } from "@/theme";
import { STAR_COLOR, Stars } from "./Stars";

export function formatRating(value, lang) {
    return value == null ? "—" : value.toLocaleString(lang === "fr" ? "fr-FR" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Note d'une app : moyenne, étoiles, nombre de notes et répartition de 5 à 1 étoiles. */
export default function RatingSummary({ average, count, distribution }) {
    const t = useTheme();
    const { t: tr, lang } = useI18n();
    const max = Math.max(1, ...Object.values(distribution ?? {}));
    return (
        <View style={styles.root}>
            <View style={styles.big}>
                <Text style={[styles.value, { color: t.text }]}>{formatRating(count ? average : null, lang)}</Text>
                <Stars value={average} size={14} emptyColor={t.textMuted} />
                <Text style={[font.tiny, { color: t.textSecondary, marginTop: 4 }]}>
                    {count ? tr("reviews.count", { count, formatted: formatCount(count) }) : tr("reviews.noRatings")}
                </Text>
            </View>
            <View style={styles.bars}>
                {[5, 4, 3, 2, 1].map((n) => {
                    const v = distribution?.[n] ?? distribution?.[String(n)] ?? 0;
                    return (
                        <View key={n} style={styles.barRow}>
                            <Text style={[font.tiny, styles.barLabel, { color: t.textSecondary }]}>{n}</Text>
                            <View style={[styles.track, { backgroundColor: t.surfaceAlt }]}>
                                <View style={[styles.fill, { width: `${(v / max) * 100}%`, backgroundColor: STAR_COLOR }]} />
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
    big: { alignItems: "center", minWidth: 96 },
    value: { fontSize: 44, fontWeight: "800", letterSpacing: -1, lineHeight: 50 },
    bars: { flex: 1, gap: 5 },
    barRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    barLabel: { width: 10, textAlign: "center" },
    track: { flex: 1, height: 8, borderRadius: radius.pill, overflow: "hidden" },
    fill: { height: "100%", borderRadius: radius.pill },
});
