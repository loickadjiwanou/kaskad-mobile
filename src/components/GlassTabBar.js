// Barre d'onglets "Liquid Glass" : pilule flottante en verre dépoli, indicateur actif glissant,
// masquage au défilement. Adaptée de liquid-glass-bottom-nav-bar pour iOS, Android et le web (Electron).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsWide } from "@/lib/hooks";
import { useTheme } from "@/theme";
import Icon from "./Icon";
import { Text } from "./Text";

const BAR_HEIGHT = 64;
const PADDING = 8;
const SIDE_MARGIN = 16;
const DOCK_MAX_WIDTH = 560; // desktop : barre centrée façon dock
const SPRING = { damping: 20, stiffness: 200, mass: 0.7 };

// iOS et web (backdrop-filter) floutent réellement ; sur Android le flou natif est expérimental
// et coûteux : on s'appuie sur une base en dégradé quasi opaque.
const USE_BLUR = Platform.OS !== "android";

// ─── Masquage au défilement ──────────────────────────────────────────────────

const TabBarContext = createContext(null);

export function TabBarProvider({ children }) {
    const hidden = useSharedValue(0);
    const value = useMemo(() => ({ hidden }), [hidden]);
    return <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>;
}

/** Espace à réserver en bas du contenu d'un onglet pour ne pas passer sous la barre flottante. */
export function useTabBarInset() {
    const ctx = useContext(TabBarContext);
    const insets = useSafeAreaInsets();
    return ctx ? BAR_HEIGHT + bottomOffset(insets) + 16 : 0;
}

/** onScroll à brancher sur la liste d'un onglet : cache la barre en descendant, la réaffiche en remontant. */
export function useTabBarScroll() {
    const ctx = useContext(TabBarContext);
    const lastY = useRef(0);
    return useCallback(
        (e) => {
            if (!ctx) return;
            const y = e.nativeEvent.contentOffset.y;
            const delta = y - lastY.current;
            if (y < 60 || delta < -8) ctx.hidden.value = withTiming(0, { duration: 220 });
            else if (delta > 8) ctx.hidden.value = withTiming(1, { duration: 220 });
            if (Math.abs(delta) > 8 || y < 60) lastY.current = y;
        },
        [ctx],
    );
}

// Position verticale de la barre :
//  - iOS : posée juste au-dessus de l'indicateur d'accueil (la zone sûre du bas inclut une marge sous l'indicateur) ;
//  - Android : juste au-dessus de la barre de navigation système ;
//  - sans zone sûre (desktop, anciens appareils) : petite marge.
function bottomOffset(insets) {
    if (Platform.OS === "ios" && insets.bottom > 0) return Math.max(insets.bottom - 14, 8);
    if (insets.bottom > 0) return insets.bottom + 4;
    return 12;
}

// ─── Palette verre selon le thème ────────────────────────────────────────────

function glassColors(t) {
    if (!t.isDark) {
        return {
            base: ["rgba(255,255,255,0.90)", "rgba(241,245,249,0.92)"],
            baseOpaque: ["rgba(255,255,255,0.97)", "rgba(241,245,249,0.97)"],
            tint: "systemUltraThinMaterialLight",
            specular: ["rgba(255,255,255,0.7)", "rgba(255,255,255,0)"],
            active: ["rgba(255,255,255,1)", "rgba(248,250,252,0.96)"],
            activeBorder: "rgba(255,255,255,0.95)",
            border: "rgba(148,163,184,0.45)",
            shadow: 0.16,
        };
    }
    const black = t.scheme === "black";
    return {
        base: black ? ["rgba(28,28,31,0.72)", "rgba(10,10,12,0.78)"] : ["rgba(30,41,59,0.72)", "rgba(15,23,42,0.80)"],
        baseOpaque: black ? ["rgba(28,28,31,0.97)", "rgba(12,12,14,0.97)"] : ["rgba(30,41,59,0.97)", "rgba(15,23,42,0.97)"],
        tint: "systemUltraThinMaterialDark",
        specular: ["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"],
        active: ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.08)"],
        activeBorder: "rgba(255,255,255,0.14)",
        border: black ? "rgba(255,255,255,0.10)" : "rgba(148,163,184,0.22)",
        shadow: 0.45,
    };
}

// ─── Bouton d'onglet ─────────────────────────────────────────────────────────

function TabButton({ label, icon, active, badge, badgeColor, color, onPress, onLongPress, accessibilityLabel }) {
    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={accessibilityLabel ?? label}
            style={styles.tabBtn}
        >
            <View style={[styles.tabInner, { opacity: active ? 1 : 0.6 }]}>
                <View>
                    <Icon name={icon} size={23} color={color} />
                    {badge != null && (
                        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                            <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                    {label}
                </Text>
            </View>
        </Pressable>
    );
}

// ─── Barre ───────────────────────────────────────────────────────────────────

/** À passer à <Tabs tabBar={(props) => <GlassTabBar {...props} />} />. */
export default function GlassTabBar({ state, descriptors, navigation }) {
    const t = useTheme();
    const g = glassColors(t);
    const insets = useSafeAreaInsets();
    const wide = useIsWide();
    const { width: windowWidth } = useWindowDimensions();
    const ctx = useContext(TabBarContext);
    const [barWidth, setBarWidth] = useState(0);

    const routes = state.routes;
    const tabW = barWidth > 0 ? (barWidth - PADDING * 2) / routes.length : 0;

    // L'indicateur suit l'onglet actif, y compris lors d'une navigation par lien (router.navigate)
    const pillX = useSharedValue(0);
    const placed = useRef(false);
    useEffect(() => {
        if (!tabW) return;
        const x = state.index * tabW;
        pillX.value = placed.current ? withSpring(x, SPRING) : x;
        placed.current = true;
        if (ctx) ctx.hidden.value = withTiming(0, { duration: 220 });
    }, [state.index, tabW, pillX, ctx]);

    const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.value }] }));

    const fallback = useSharedValue(0);
    const hidden = ctx?.hidden ?? fallback;
    const bottom = bottomOffset(insets);
    const barStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: hidden.value * (BAR_HEIGHT + bottom + 12) }],
        opacity: 1 - hidden.value,
    }));

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.wrap,
                { bottom, left: SIDE_MARGIN + insets.left, right: SIDE_MARGIN + insets.right },
                wide ? { width: DOCK_MAX_WIDTH, left: (windowWidth - DOCK_MAX_WIDTH) / 2, right: undefined } : null,
                barStyle,
            ]}
            onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        >
            {/* ombre hors du overflow:hidden pour ne pas être rognée */}
            <View style={[styles.shadow, { shadowOpacity: g.shadow }]} />

            <View style={[styles.pill, { borderColor: g.border }]}>
                <LinearGradient colors={USE_BLUR ? g.base : g.baseOpaque} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                {USE_BLUR && <BlurView intensity={Platform.OS === "ios" ? 55 : 40} tint={g.tint} style={StyleSheet.absoluteFill} />}
                <LinearGradient colors={g.specular} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.specular} pointerEvents="none" />

                {tabW > 0 && (
                    <Animated.View style={[styles.activePill, { width: tabW, borderColor: g.activeBorder }, pillStyle]} pointerEvents="none">
                        <LinearGradient colors={g.active} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                    </Animated.View>
                )}

                <View style={styles.tabRow}>
                    {routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const active = state.index === index;
                        const color = active ? t.primary : t.text;
                        const onPress = () => {
                            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                            if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
                        };
                        const onLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });
                        return (
                            <TabButton
                                key={route.key}
                                label={options.tabBarLabel ?? options.title ?? route.name}
                                accessibilityLabel={options.title}
                                icon={active ? options.tabBarIconName : (options.tabBarIconNameInactive ?? options.tabBarIconName)}
                                active={active}
                                color={color}
                                badge={options.tabBarBadge}
                                badgeColor={options.tabBarBadgeStyle?.backgroundColor ?? t.danger}
                                onPress={onPress}
                                onLongPress={onLongPress}
                            />
                        );
                    })}
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: { position: "absolute", left: SIDE_MARGIN, right: SIDE_MARGIN, height: BAR_HEIGHT },
    shadow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BAR_HEIGHT / 2,
        backgroundColor: "rgba(255,255,255,0.01)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 24,
        elevation: 16,
    },
    pill: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BAR_HEIGHT / 2,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
    },
    specular: { position: "absolute", top: 0, left: 0, right: 0, height: 24 },
    activePill: {
        position: "absolute",
        top: PADDING,
        bottom: PADDING,
        left: PADDING,
        borderRadius: (BAR_HEIGHT - PADDING * 2) / 2,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
    },
    tabRow: { ...StyleSheet.absoluteFillObject, flexDirection: "row", paddingHorizontal: PADDING },
    tabBtn: { flex: 1 },
    tabInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, paddingHorizontal: 2 },
    tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.1 },
    badge: {
        position: "absolute",
        top: -4,
        right: -10,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
