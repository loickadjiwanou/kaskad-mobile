import { useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Easing, Platform, Pressable, StyleSheet, View } from "react-native";
import { useOverlayStore } from "@/store/overlays";
import { font, radius, spacing, useTheme } from "@/theme";
import Button from "./Button";
import Icon from "./Icon";
import { Text } from "./Text";

const TONES = {
    info: { icon: "information-outline", color: "primary" },
    question: { icon: "help-circle-outline", color: "primary" },
    success: { icon: "check-circle-outline", color: "success" },
    danger: { icon: "alert-circle-outline", color: "danger" },
};

/**
 * Alerte maison (remplace Alert natif et window.alert / confirm) : carte centrée sur un voile,
 * apparition en fondu + zoom léger. Retour Android / Échap = annuler, Entrée = action principale.
 */
export default function DialogHost() {
    const t = useTheme();
    const dialog = useOverlayStore((s) => s.dialog);
    const closeDialog = useOverlayStore((s) => s.closeDialog);
    const [shown, setShown] = useState(null);
    const anim = useRef(new Animated.Value(0)).current;

    // Garde l'alerte affichée pendant l'animation de sortie
    useEffect(() => {
        if (dialog) {
            setShown(dialog);
            anim.setValue(0);
            Animated.timing(anim, {
                toValue: 1,
                duration: 180,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: Platform.OS !== "web",
            }).start();
        } else if (shown) {
            Animated.timing(anim, { toValue: 0, duration: 140, useNativeDriver: Platform.OS !== "web" }).start(() => setShown(null));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialog]);

    useEffect(() => {
        if (!dialog) return;
        const primary = [...dialog.actions].reverse().find((a) => a.variant === "primary" || a.variant === "dangerSolid");
        if (Platform.OS === "web") {
            const onKey = (e) => {
                if (e.key === "Escape") closeDialog(dialog.cancelValue);
                else if (e.key === "Enter" && primary) closeDialog(primary.value);
            };
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
        }
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            closeDialog(dialog.cancelValue);
            return true;
        });
        return () => sub.remove();
    }, [dialog, closeDialog]);

    if (!shown) return null;
    const tone = TONES[shown.tone] ?? TONES.info;
    const toneColor = t[tone.color];
    const stacked = shown.stacked || shown.actions.length > 2;
    const active = dialog?.id === shown.id;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={active ? "auto" : "none"}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: anim }]}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => active && closeDialog(shown.cancelValue)}
                    accessibilityLabel="close"
                />
            </Animated.View>
            <View style={styles.center} pointerEvents="box-none">
                <Animated.View
                    accessibilityRole="alert"
                    style={[
                        styles.card,
                        { backgroundColor: t.surface, borderColor: t.border },
                        { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] },
                    ]}
                >
                    <View style={[styles.iconWrap, { backgroundColor: t.surfaceAlt }]}>
                        <Icon name={tone.icon} size={26} color={toneColor} />
                    </View>
                    {!!shown.title && <Text style={[font.h3, styles.title, { color: t.text }]}>{shown.title}</Text>}
                    {!!shown.message && <Text style={[font.body, styles.message, { color: t.textSecondary }]}>{shown.message}</Text>}
                    <View style={[styles.actions, stacked && styles.actionsStacked]}>
                        {shown.actions.map((a, i) => (
                            <Button
                                key={`${a.label}-${i}`}
                                title={a.label}
                                variant={a.variant}
                                onPress={() => active && closeDialog(a.value)}
                                style={stacked ? styles.stackedButton : styles.rowButton}
                            />
                        ))}
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: { backgroundColor: "rgba(2,6,23,0.55)" },
    center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: spacing.xl },
    card: {
        width: "100%",
        maxWidth: 400,
        borderRadius: radius.xl,
        borderWidth: 1,
        padding: spacing.xl,
        alignItems: "center",
        gap: spacing.sm,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 24,
    },
    iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
    title: { textAlign: "center" },
    message: { textAlign: "center" },
    actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, alignSelf: "stretch" },
    actionsStacked: { flexDirection: "column" },
    rowButton: { flex: 1 },
    stackedButton: { alignSelf: "stretch" },
});
