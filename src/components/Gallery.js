import { FlatList, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useI18n } from "@/i18n";
import { radius, spacing, useTheme } from "@/theme";

/**
 * Galerie de captures d'écran. Un appui ouvre la visionneuse plein écran (route /gallery),
 * affichée par-dessus en transparence : elle vit dans la fenêtre de l'app (pas de Modal native),
 * ce qui permet sur Android de passer sous les barres système et de masquer la barre de navigation.
 */
export default function Gallery({ screenshots = [] }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const { height } = useWindowDimensions();
    if (!screenshots.length) return null;

    const thumbH = Math.min(360, height * 0.42);
    const thumbW = thumbH * (9 / 16);
    const open = (index) => router.push({ pathname: "/gallery", params: { images: JSON.stringify(screenshots), index: String(index) } });

    return (
        <FlatList
            horizontal
            data={screenshots}
            keyExtractor={(u, i) => `${i}-${u}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            renderItem={({ item, index }) => (
                <Pressable
                    onPress={() => open(index)}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={tr("app.screenshot", { n: index + 1 })}
                >
                    <Image
                        source={{ uri: item }}
                        style={{ width: thumbW, height: thumbH, borderRadius: radius.lg, backgroundColor: t.surfaceAlt }}
                        contentFit="cover"
                        transition={200}
                    />
                </Pressable>
            )}
        />
    );
}
