import { StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import { useI18n } from "@/i18n";
import { font, spacing, useTheme } from "@/theme";
import IconButton from "./IconButton";

export function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
}

export default function ScreenHeader({ title, subtitle, back = false, right, large = true }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    return (
        <View style={styles.wrap}>
            {back && (
                <View style={styles.topRow}>
                    <IconButton name="arrow-left" onPress={goBack} label={tr("common.back")} />
                    {!large && <Text style={[font.h3, styles.inlineTitle, { color: t.text }]} numberOfLines={1}>{title}</Text>}
                    <View style={styles.right}>{right}</View>
                </View>
            )}
            {large && (
                <View style={styles.titleRow}>
                    <View style={{ flex: 1 }}>
                        {/* Une seule ligne : un titre long (ex. "Téléchargements") réduit sa taille au lieu d'être coupé en plein mot */}
                        <Text
                            style={[font.h1, { color: t.text }]}
                            accessibilityRole="header"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                        >
                            {title}
                        </Text>
                        {!!subtitle && <Text style={[font.body, { color: t.textSecondary, marginTop: 2 }]}>{subtitle}</Text>}
                    </View>
                    {!back && <View style={styles.right}>{right}</View>}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
    topRow: { flexDirection: "row", alignItems: "center", marginLeft: -8 },
    inlineTitle: { flex: 1, marginLeft: spacing.xs },
    titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    right: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" },
});
