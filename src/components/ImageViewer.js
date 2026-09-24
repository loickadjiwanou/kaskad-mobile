import { useEffect, useRef, useState } from "react";
import { FlatList, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/i18n";
import { spacing } from "@/theme";
import IconButton from "./IconButton";
import { Text } from "./Text";

/**
 * Visionneuse plein écran. Les éléments reçoivent une hauteur mesurée explicitement :
 * sur le web, une liste horizontale n'étire pas ses éléments en hauteur (image de hauteur 0).
 * Desktop : flèches précédent / suivant, touches ← → et Échap.
 */
export default function ImageViewer({ screenshots, index, onIndexChange, onClose }) {
    const { t: tr } = useI18n();

    // Android : mode immersif pendant la visionneuse (barre de navigation masquée, réaffichable d'un glissement
    // depuis le bas), comme les galeries photo natives. Sinon Android garde un voile opaque sous la barre à 3 boutons.
    useEffect(() => {
        if (Platform.OS !== "android") return;
        NavigationBar.setVisibilityAsync("hidden").catch(() => {});
        return () => {
            NavigationBar.setVisibilityAsync("visible").catch(() => {});
        };
    }, []);
    const { width } = useWindowDimensions();
    const [areaHeight, setAreaHeight] = useState(0);
    const list = useRef(null);
    const current = useRef(index);
    current.current = index;

    const goTo = (i) => {
        const next = Math.max(0, Math.min(screenshots.length - 1, i));
        list.current?.scrollToIndex({ index: next, animated: true });
        onIndexChange(next);
    };

    useEffect(() => {
        if (Platform.OS !== "web") return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowRight") goTo(current.current + 1);
            else if (e.key === "ArrowLeft") goTo(current.current - 1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenshots.length]);

    return (
        <SafeAreaView style={styles.viewer}>
            {/* Icônes claires sur le fond sombre de la visionneuse */}
            <StatusBar style="light" />
            <View style={styles.viewerTop}>
                <Text style={styles.counter}>{`${index + 1} / ${screenshots.length}`}</Text>
                <IconButton name="close" color="#fff" onPress={onClose} label={tr("common.close")} />
            </View>
            <View style={{ flex: 1 }} onLayout={(e) => setAreaHeight(e.nativeEvent.layout.height)}>
                {areaHeight > 0 && (
                    <FlatList
                        ref={list}
                        horizontal
                        pagingEnabled
                        data={screenshots}
                        initialScrollIndex={index}
                        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                        keyExtractor={(u, i) => `full-${i}`}
                        onScroll={(e) => {
                            const i = Math.round(e.nativeEvent.contentOffset.x / width);
                            if (i !== current.current && i >= 0 && i < screenshots.length) onIndexChange(i);
                        }}
                        scrollEventThrottle={32}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={{ width, height: areaHeight, padding: spacing.lg }}>
                                <Image source={{ uri: item }} style={styles.full} contentFit="contain" transition={150} />
                            </View>
                        )}
                    />
                )}
                {Platform.OS === "web" && index > 0 && (
                    <IconButton
                        name="chevron-left"
                        size={34}
                        color="#fff"
                        onPress={() => goTo(index - 1)}
                        label="←"
                        style={[styles.arrow, { left: spacing.lg }]}
                    />
                )}
                {Platform.OS === "web" && index < screenshots.length - 1 && (
                    <IconButton
                        name="chevron-right"
                        size={34}
                        color="#fff"
                        onPress={() => goTo(index + 1)}
                        label="→"
                        style={[styles.arrow, { right: spacing.lg }]}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    viewer: { flex: 1, backgroundColor: "rgba(2,6,23,0.97)" },
    viewerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg },
    counter: { color: "#fff", fontWeight: "700" },
    full: { width: "100%", height: "100%" },
    arrow: { position: "absolute", top: "50%", marginTop: -29, backgroundColor: "rgba(255,255,255,0.12)" },
});
