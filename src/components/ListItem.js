import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { font, spacing, useTheme } from "@/theme";
import Icon from "./Icon";

/** Ligne de réglage / menu. */
export default function ListItem({ icon, title, subtitle, onPress, right, danger = false, chevron = !!onPress }) {
    const t = useTheme();
    const color = danger ? t.danger : t.text;
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? t.surfaceAlt : "transparent" }]}
            accessibilityRole={onPress ? "button" : undefined}
        >
            {icon && (
                <View style={[styles.icon, { backgroundColor: danger ? "transparent" : t.primarySoft }]}>
                    <Icon name={icon} size={19} color={danger ? t.danger : t.primary} />
                </View>
            )}
            <View style={{ flex: 1 }}>
                <Text style={[font.body, { color, fontWeight: "600" }]}>{title}</Text>
                {!!subtitle && <Text style={[font.small, { color: t.textSecondary }]}>{subtitle}</Text>}
            </View>
            {right}
            {chevron && <Icon name="chevron-right" size={20} color={t.textMuted} />}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    icon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
