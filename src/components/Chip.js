import { Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/Text";
import { radius, useTheme } from "@/theme";
import Icon from "./Icon";

export default function Chip({ label, icon, selected = false, onPress, style }) {
    const t = useTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
                styles.chip,
                {
                    backgroundColor: selected ? t.primary : t.surface,
                    borderColor: selected ? t.primary : t.border,
                    opacity: pressed ? 0.8 : 1,
                },
                style,
            ]}
        >
            {icon && <Icon name={icon} size={16} color={selected ? t.onPrimary : t.textSecondary} />}
            <Text style={[styles.label, { color: selected ? t.onPrimary : t.text }]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        borderWidth: 1,
    },
    label: { fontSize: 13, fontWeight: "600" },
});
