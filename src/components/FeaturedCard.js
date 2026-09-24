import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "@/i18n";
import { font, radius, spacing, useTheme } from "@/theme";
import AppIcon from "./AppIcon";
import Icon from "./Icon";

/** Grande carte "en vedette" aux couleurs de la marque. */
export default function FeaturedCard({ app, width }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    return (
        <Pressable
            onPress={() => router.push(`/app/${app.id}`)}
            style={({ pressed }) => [{ width, opacity: pressed ? 0.9 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={tr("home.featuredA11y", { name: app.name })}
        >
            <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
                <View style={styles.badge}>
                    <Icon name="star-four-points" size={12} color="#fff" />
                    <Text style={styles.badgeText}>{tr("home.featuredBadge")}</Text>
                </View>
                <Text style={[font.h2, styles.title]} numberOfLines={1}>
                    {app.name}
                </Text>
                <Text style={styles.desc} numberOfLines={2}>
                    {app.short_description}
                </Text>
                <View style={styles.footer}>
                    <AppIcon app={app} size={44} />
                    <View style={styles.cta}>
                        <Text style={styles.ctaText}>{tr("home.discover")}</Text>
                    </View>
                </View>
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, minHeight: 190 },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.22)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.pill,
    },
    badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    title: { color: "#fff" },
    desc: { color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 20 },
    footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
    cta: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
    ctaText: { color: "#1E4FD6", fontWeight: "800" },
});
