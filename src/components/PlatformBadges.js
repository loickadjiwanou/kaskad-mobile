import { StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { detectPlatform, formatLabel, platformIcon, platformLabel } from "@/lib/platform";
import { radius, useTheme } from "@/theme";
import Icon from "./Icon";

/** Icônes des plateformes supportées ; celle du terminal est mise en avant. */
export function PlatformIcons({ platforms = [], size = 14 }) {
    const t = useTheme();
    const { target } = detectPlatform();
    return (
        <View style={styles.row}>
            {platforms.map((p) => (
                <Icon key={p} name={platformIcon(p)} size={size} color={p === target ? t.primary : t.textMuted} />
            ))}
        </View>
    );
}

export function FormatBadge({ platform, format, highlight = false }) {
    const t = useTheme();
    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: highlight ? t.primarySoft : t.surfaceAlt, borderColor: highlight ? t.primary : "transparent" },
            ]}
        >
            <Icon name={platformIcon(platform)} size={13} color={highlight ? t.primary : t.textSecondary} />
            <Text style={[styles.badgeText, { color: highlight ? t.primary : t.textSecondary }]}>
                {platformLabel(platform)} · {formatLabel(format)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", gap: 6, alignItems: "center" },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: radius.pill,
        borderWidth: 1,
        alignSelf: "flex-start",
    },
    badgeText: { fontSize: 12, fontWeight: "600" },
});
