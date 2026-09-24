import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import * as Clipboard from "expo-clipboard";
import { chunkHash } from "@/lib/format";
import { useI18n } from "@/i18n";
import { font, radius, spacing, useTheme } from "@/theme";
import Icon from "./Icon";

/** Affiche un SHA-256 lisible (blocs de 8) avec copie en un geste. */
export default function HashBox({ hash, label = "SHA-256" }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const [copied, setCopied] = useState(false);
    if (!hash) return null;
    const copy = async () => {
        await Clipboard.setStringAsync(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <Pressable
            onPress={copy}
            style={[styles.box, { backgroundColor: t.surfaceAlt }]}
            accessibilityRole="button"
            accessibilityLabel={tr("hash.copyA11y", { label })}
        >
            <View style={styles.head}>
                <Text style={[font.tiny, { color: t.textSecondary, fontWeight: "700", letterSpacing: 0.8 }]}>{label}</Text>
                <View style={styles.copy}>
                    <Icon name={copied ? "check" : "content-copy"} size={14} color={copied ? t.success : t.primary} />
                    <Text style={[font.tiny, { color: copied ? t.success : t.primary, fontWeight: "700" }]}>
                        {copied ? tr("common.copied") : tr("common.copy")}
                    </Text>
                </View>
            </View>
            <Text style={[font.mono, { color: t.text, lineHeight: 18 }]} selectable>
                {chunkHash(hash)}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    box: { borderRadius: radius.md, padding: spacing.md, gap: 6 },
    head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    copy: { flexDirection: "row", alignItems: "center", gap: 4 },
});
