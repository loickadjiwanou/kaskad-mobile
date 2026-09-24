import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/Text";
import { radius, useTheme } from "@/theme";
import Icon from "./Icon";

export default function Button({
    title,
    onPress,
    icon,
    variant = "primary", // primary | secondary | ghost | danger | dangerSolid
    size = "md",
    loading = false,
    disabled = false,
    style,
    full = false,
}) {
    const t = useTheme();
    const colors = {
        primary: { bg: t.primary, fg: t.onPrimary, border: t.primary },
        secondary: { bg: t.primarySoft, fg: t.primary, border: t.primarySoft },
        ghost: { bg: "transparent", fg: t.text, border: t.border },
        danger: { bg: "transparent", fg: t.danger, border: t.danger },
        dangerSolid: { bg: t.danger, fg: "#FFFFFF", border: t.danger },
    }[variant];
    const small = size === "sm";
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            accessibilityRole="button"
            style={({ pressed }) => [
                styles.base,
                {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    paddingVertical: small ? 7 : 12,
                    paddingHorizontal: small ? 12 : 18,
                    opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
                    alignSelf: full ? "stretch" : "auto",
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={colors.fg} size="small" />
            ) : (
                icon && <Icon name={icon} size={small ? 16 : 19} color={colors.fg} />
            )}
            {!!title && (
                <Text style={[styles.label, { color: colors.fg, fontSize: small ? 13 : 15 }]} numberOfLines={1}>
                    {title}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: radius.pill,
        borderWidth: 1,
    },
    label: { fontWeight: "700" },
});
