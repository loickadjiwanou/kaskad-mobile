import { Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, useTheme } from "@/theme";
import { useTabBarInset, useTabBarScroll } from "./GlassTabBar";

// iOS : on remonte légèrement le contenu, la zone sûre du haut laissant un espace visible sous la barre d'état
export const TOP_ADJUST = Platform.OS === "ios" ? -8 : 0;

/** Conteneur d'écran : fond, zone sûre, largeur max sur desktop, pull-to-refresh optionnel. */
export default function Screen({ children, scroll = true, refreshing = false, onRefresh, edges = ["top", "left", "right"], contentStyle }) {
    const t = useTheme();
    // Dans un onglet : marge sous le contenu pour la barre flottante + masquage au défilement
    const tabBarInset = useTabBarInset();
    const onScroll = useTabBarScroll();
    const inner = <View style={[styles.inner, contentStyle]}>{children}</View>;
    return (
        <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: t.background }]}>
            {scroll ? (
                <ScrollView
                    contentContainerStyle={[styles.scroll, tabBarInset > 0 && { paddingBottom: tabBarInset }]}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} colors={[t.primary]} />
                        ) : undefined
                    }
                >
                    {inner}
                </ScrollView>
            ) : (
                inner
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
    inner: { flex: 1, width: "100%", marginTop: TOP_ADJUST },
});
