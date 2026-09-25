import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import { formatCount } from "@/lib/format";
import { font, spacing, useTheme } from "@/theme";
import AppIcon from "./AppIcon";
import Icon from "./Icon";
import { PlatformIcons } from "./PlatformBadges";
import { formatRating } from "./RatingSummary";
import { STAR_COLOR } from "./Stars";
import { getLanguage } from "@/i18n";

/** Ligne d'application pour les listes (catégories, recherche, favoris…). */
export default function AppRow({ app, right, subtitle, onPress }) {
    const t = useTheme();
    return (
        <Pressable
            onPress={onPress ?? (() => router.push(`/app/${app.id}`))}
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? t.surfaceAlt : "transparent" }]}
            accessibilityRole="button"
            accessibilityLabel={app.name}
        >
            <AppIcon app={app} size={56} />
            <View style={styles.body}>
                <Text style={[font.h3, { color: t.text }]} numberOfLines={1}>
                    {app.name}
                </Text>
                <Text style={[font.small, { color: t.textSecondary }]} numberOfLines={2}>
                    {subtitle ?? app.short_description}
                </Text>
                {!!app.platforms && (
                    <View style={styles.meta}>
                        <PlatformIcons platforms={app.platforms} />
                        {app.rating_count > 0 && (
                            <View style={styles.meta}>
                                <Icon name="star" size={13} color={STAR_COLOR} />
                                <Text style={[font.tiny, { color: t.textSecondary, fontWeight: "600" }]}>{formatRating(app.rating_average, getLanguage())}</Text>
                            </View>
                        )}
                        {app.downloads_count != null && (
                            <View style={styles.meta}>
                                <Icon name="download" size={13} color={t.textMuted} />
                                <Text style={[font.tiny, { color: t.textMuted }]}>{formatCount(app.downloads_count)}</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
            {right}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    body: { flex: 1, gap: 3 },
    meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
});
