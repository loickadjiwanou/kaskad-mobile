import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { useI18n } from "@/i18n";
import { font, spacing, useTheme } from "@/theme";

export default function SectionHeader({ title, actionLabel, onAction }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    return (
        <View style={styles.row}>
            <Text style={[font.h2, { color: t.text, flex: 1 }]} accessibilityRole="header">
                {title}
            </Text>
            {onAction && (
                <Pressable onPress={onAction} hitSlop={8}>
                    <Text style={{ color: t.primary, fontWeight: "700" }}>{actionLabel ?? tr("common.seeAll")}</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
});
