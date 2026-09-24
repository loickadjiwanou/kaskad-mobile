import { Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import { font, spacing, useTheme } from "@/theme";
import AppIcon from "./AppIcon";
import { PlatformIcons } from "./PlatformBadges";

/** Tuile compacte pour les carrousels horizontaux (nouveautés, populaires). */
export default function AppTile({ app, width = 112 }) {
    const t = useTheme();
    return (
        <Pressable
            onPress={() => router.push(`/app/${app.id}`)}
            style={({ pressed }) => [styles.tile, { width, opacity: pressed ? 0.8 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={app.name}
        >
            <AppIcon app={app} size={width - 16} />
            <Text style={[font.small, { color: t.text, fontWeight: "600" }]} numberOfLines={1}>
                {app.name}
            </Text>
            <PlatformIcons platforms={app.platforms} size={12} />
        </Pressable>
    );
}

const styles = StyleSheet.create({ tile: { gap: 6, padding: spacing.sm } });
