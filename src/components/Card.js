import { StyleSheet, View } from "react-native";
import { radius, spacing, useTheme } from "@/theme";

export default function Card({ children, style, padded = true }) {
    const t = useTheme();
    return (
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, padded && styles.padded, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
    padded: { padding: spacing.lg },
});
