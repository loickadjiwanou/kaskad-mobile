import { Children } from "react";
import { StyleSheet, View } from "react-native";
import { useColumns } from "@/lib/hooks";
import { spacing } from "@/theme";

/**
 * Grille responsive : 1 colonne sur téléphone, jusqu'à `max` sur grand écran (tablette paysage, desktop).
 * `gap` : espacement entre cartes (0 pour des lignes de liste pleine largeur).
 */
export default function Grid({ children, max = 4, gap = 0, padded = false, style }) {
    const cols = useColumns({ max });
    const items = Children.toArray(children);
    if (cols === 1) return <View style={[padded && styles.padded, { gap }, style]}>{items}</View>;

    // Espacement horizontal via une marge interne de chaque cellule (compatible natif, sans calc())
    const half = gap / 2;
    return (
        <View style={[padded && styles.padded, style]}>
            <View style={[styles.grid, { marginHorizontal: -half, rowGap: gap }]}>
                {items.map((child, i) => (
                    <View key={child.key ?? i} style={{ width: `${100 / cols}%`, paddingHorizontal: half }}>
                        {child}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap" },
    padded: { paddingHorizontal: spacing.lg },
});
