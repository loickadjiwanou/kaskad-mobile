import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme";

export default function ProgressBar({ value = 0, height = 6, muted = false }) {
    const t = useTheme();
    const pct = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
    return (
        <View style={[styles.track, { height, backgroundColor: t.surfaceAlt, borderRadius: height }]}>
            {muted ? (
                <View style={{ width: pct, height, backgroundColor: t.textMuted, borderRadius: height }} />
            ) : (
                <LinearGradient
                    colors={t.gradientShort}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: pct, height, borderRadius: height }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({ track: { width: "100%", overflow: "hidden" } });
