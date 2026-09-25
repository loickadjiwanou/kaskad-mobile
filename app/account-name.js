import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Text, TextInput } from "@/components/Text";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Screen from "@/components/Screen";
import ScreenHeader, { goBack } from "@/components/ScreenHeader";
import { useI18n } from "@/i18n";
import { toast } from "@/lib/dialog";
import { updateName } from "@/services/account";
import { displayName, useAuthStore } from "@/store/auth";
import { font, radius, spacing, useTheme } from "@/theme";

/** Nom public du compte e-mail : affiché avec les avis (tous ses avis sont mis à jour). */
export default function AccountName() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const user = useAuthStore((s) => s.user);
    const [name, setName] = useState(displayName(user));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const save = async () => {
        if (name.trim().length < 2) return setError(tr("auth.missingName"));
        setError(null);
        setBusy(true);
        try {
            await updateName(name);
            toast(tr("profile.nameSaved"), { type: "success" });
            router.canGoBack() ? goBack() : router.replace("/profile");
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <Screen edges={["top", "left", "right", "bottom"]}>
                <ScreenHeader back title={tr("profile.nameTitle")} subtitle={user?.email} />
                <View style={styles.body}>
                    <Card style={{ gap: spacing.md }}>
                        <Text style={[font.small, { color: t.textSecondary, fontWeight: "600" }]}>{tr("auth.name")}</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            maxLength={40}
                            autoFocus
                            autoComplete="name"
                            placeholder={tr("auth.namePlaceholder")}
                            placeholderTextColor={t.textMuted}
                            onSubmitEditing={save}
                            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.background }]}
                        />
                        <Text style={[font.small, { color: t.textSecondary }]}>{tr("profile.nameHelp")}</Text>
                        {!!error && <Text style={[font.small, { color: t.danger }]}>{error}</Text>}
                        <Button title={tr("profile.saveName")} onPress={save} loading={busy} full />
                    </Card>
                </View>
            </Screen>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    body: { paddingHorizontal: spacing.lg, marginTop: spacing.md, width: "100%", maxWidth: 480, alignSelf: "center" },
    input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16 },
});
