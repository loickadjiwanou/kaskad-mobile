import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TextInput } from "@/components/Text";
import { api } from "@/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import { REPORT_REASONS } from "@/components/ReviewItem";
import Screen from "@/components/Screen";
import ScreenHeader, { goBack } from "@/components/ScreenHeader";
import { useI18n } from "@/i18n";
import { toast } from "@/lib/dialog";
import { font, radius, spacing, useTheme } from "@/theme";

const REASON_ICONS = {
    malware: "bug-outline",
    abusive: "alert-octagon-outline",
    copyright: "copyright",
    misleading: "alert-outline",
    broken: "wrench-outline",
    other: "dots-horizontal-circle-outline",
};

/** Signaler une app (logiciel malveillant, contenu abusif…) : le signalement est envoyé à la modération de Kaskad. */
export default function ReportApp() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const { id, name } = useLocalSearchParams();
    const [reason, setReason] = useState(null);
    const [details, setDetails] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const submit = async () => {
        if (!reason) return setError(tr("report.pickReason"));
        setError(null);
        setBusy(true);
        try {
            await api.reportApp(id, { reason, details: details.trim() });
            toast(tr("report.sent"), { type: "success" });
            router.canGoBack() ? goBack() : router.replace(`/app/${id}`);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Screen edges={["top", "left", "right", "bottom"]}>
            <ScreenHeader back title={tr("report.title")} subtitle={name} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.body}>
                <Text style={[font.body, { color: t.textSecondary }]}>{tr("report.intro")}</Text>
                <Card padded={false}>
                    {REPORT_REASONS.map((r, i) => {
                        const selected = reason === r;
                        return (
                            <Pressable
                                key={r}
                                onPress={() => {
                                    setReason(r);
                                    setError(null);
                                }}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: selected }}
                                style={({ pressed }) => [
                                    styles.reason,
                                    i > 0 && { borderTopWidth: 1, borderTopColor: t.border },
                                    pressed && { backgroundColor: t.surfaceAlt },
                                ]}
                            >
                                <Icon name={REASON_ICONS[r]} size={22} color={selected ? t.primary : t.textSecondary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[font.body, { color: t.text, fontWeight: "600" }]}>{tr(`reviews.reasons.${r}`)}</Text>
                                    <Text style={[font.small, { color: t.textSecondary }]}>{tr(`report.help.${r}`)}</Text>
                                </View>
                                <Icon name={selected ? "radiobox-marked" : "radiobox-blank"} size={22} color={selected ? t.primary : t.textMuted} />
                            </Pressable>
                        );
                    })}
                </Card>
                <View style={{ gap: 6 }}>
                    <Text style={[font.small, { color: t.textSecondary, fontWeight: "600" }]}>{tr("report.detailsLabel")}</Text>
                    <TextInput
                        value={details}
                        onChangeText={setDetails}
                        maxLength={2000}
                        multiline
                        textAlignVertical="top"
                        placeholder={tr("report.detailsPlaceholder")}
                        placeholderTextColor={t.textMuted}
                        style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surface }]}
                    />
                </View>
                {!!error && <Text style={[font.small, { color: t.danger }]}>{error}</Text>}
                <Button title={tr("report.submit")} icon="flag-outline" variant="dangerSolid" onPress={submit} loading={busy} full />
                <Text style={[font.tiny, { color: t.textMuted, textAlign: "center" }]}>{tr("report.privacy")}</Text>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    body: { paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.lg, width: "100%", maxWidth: 640, alignSelf: "center" },
    reason: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
    input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16, minHeight: 110 },
});
