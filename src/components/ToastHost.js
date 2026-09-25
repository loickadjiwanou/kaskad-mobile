import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOverlayStore } from "@/store/overlays";
import { font, radius, spacing, useTheme } from "@/theme";
import Icon from "./Icon";
import { Text } from "./Text";

const TYPES = {
    success: { icon: "check-circle", color: "success" },
    error: { icon: "alert-circle", color: "danger" },
    info: { icon: "information", color: "primary" },
};

function ToastItem({ toast, onDismiss }) {
    const t = useTheme();
    const anim = useRef(new Animated.Value(0)).current;
    const type = TYPES[toast.type] ?? TYPES.info;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
        }).start();
    }, [anim]);

    return (
        <Animated.View
            style={{
                // Largeur bornée à l'écran : un message long passe à la ligne au lieu de déborder des deux côtés
                maxWidth: "100%",
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
            }}
        >
            <Pressable
                onPress={onDismiss}
                accessibilityRole="alert"
                style={[styles.toast, { backgroundColor: t.surface, borderColor: t.border }]}
            >
                <Icon name={type.icon} size={20} color={t[type.color]} />
                <Text style={[font.small, styles.text, { color: t.text }]}>{toast.message}</Text>
                {toast.action && (
                    <Pressable
                        onPress={() => {
                            onDismiss();
                            toast.action.onPress();
                        }}
                        accessibilityRole="button"
                        hitSlop={8}
                        style={[styles.action, { backgroundColor: t.primary }]}
                    >
                        <Text style={[font.small, styles.actionText]}>{toast.action.label}</Text>
                    </Pressable>
                )}
            </Pressable>
        </Animated.View>
    );
}

/** Toasts maison (remplacent les toasts système), empilés en haut de l'écran. Un appui les ferme. */
export default function ToastHost() {
    const insets = useSafeAreaInsets();
    const toasts = useOverlayStore((s) => s.toasts);
    const removeToast = useOverlayStore((s) => s.removeToast);
    if (!toasts.length) return null;
    return (
        <View pointerEvents="box-none" style={[styles.container, { top: insets.top + spacing.sm }]}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { position: "absolute", left: spacing.lg, right: spacing.lg, alignItems: "center", gap: spacing.sm },
    toast: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        maxWidth: 480,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 12,
    },
    text: { fontWeight: "600", flexShrink: 1 },
    action: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginLeft: 4, flexShrink: 0 },
    actionText: { color: "#fff", fontWeight: "700" },
});
