import { StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { palette } from "@/theme";

const GRADIENTS = [
    [palette.primary.DEFAULT, palette.accent.DEFAULT],
    [palette.tertiary.DEFAULT, palette.primary.light],
    [palette.accent.dark, palette.primary.dark],
    [palette.primary.darker, palette.tertiary.light],
    [palette.accent.DEFAULT, palette.tertiary.DEFAULT],
];

function hash(str = "") {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
}

function initials(name = "") {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Icône d'application : image publiée, ou icône générée aux couleurs Kaskad. */
export default function AppIcon({ app, size = 56 }) {
    const radius = size * 0.24;
    if (app?.icon_url) {
        return (
            <Image
                source={{ uri: app.icon_url }}
                style={{ width: size, height: size, borderRadius: radius }}
                contentFit="cover"
                transition={150}
            />
        );
    }
    return (
        <LinearGradient
            colors={GRADIENTS[hash(app?.id ?? app?.name) % GRADIENTS.length]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.box, { width: size, height: size, borderRadius: radius }]}
        >
            <View>
                <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials(app?.name)}</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    box: { alignItems: "center", justifyContent: "center" },
    text: { color: "#fff", fontWeight: "800", letterSpacing: -0.5 },
});
