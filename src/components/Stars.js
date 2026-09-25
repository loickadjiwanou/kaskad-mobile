import { Pressable, StyleSheet, View } from "react-native";
import { useI18n } from "@/i18n";
import Icon from "./Icon";

export const STAR_COLOR = "#F5B301";

/** Note en étoiles (lecture seule, demi-étoiles). */
export function Stars({ value = 0, size = 14, color = STAR_COLOR, emptyColor }) {
    const rounded = Math.round((value ?? 0) * 2) / 2;
    return (
        <View style={styles.row} accessibilityRole="image" accessibilityLabel={`${value ?? 0}/5`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Icon
                    key={n}
                    name={rounded >= n ? "star" : rounded >= n - 0.5 ? "star-half-full" : "star-outline"}
                    size={size}
                    color={rounded >= n - 0.5 ? color : (emptyColor ?? color)}
                />
            ))}
        </View>
    );
}

/** Sélection d'une note de 1 à 5 étoiles. */
export function StarPicker({ value = 0, onChange, size = 36, color = STAR_COLOR, emptyColor }) {
    const { t } = useI18n();
    return (
        <View style={[styles.row, { gap: size / 4 }]} accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: 5, now: value }}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                    key={n}
                    onPress={() => onChange(n)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={t("reviews.starsA11y", { count: n })}
                    accessibilityState={{ selected: value === n }}
                >
                    <Icon name={value >= n ? "star" : "star-outline"} size={size} color={value >= n ? color : (emptyColor ?? color)} />
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 1 },
});
