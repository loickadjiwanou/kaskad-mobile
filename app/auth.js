import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/components/Text";
import { router } from "expo-router";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Screen from "@/components/Screen";
import ScreenHeader, { goBack } from "@/components/ScreenHeader";
import { login, loginAnonymous, register } from "@/services/account";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/store/auth";
import { font, radius, spacing, useTheme } from "@/theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, ...props }) {
    const t = useTheme();
    return (
        <View style={{ gap: 6 }}>
            <Text style={[font.small, { color: t.textSecondary, fontWeight: "600" }]}>{label}</Text>
            <TextInput
                placeholderTextColor={t.textMuted}
                style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.background }]}
                {...props}
            />
        </View>
    );
}

export default function Auth() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const user = useAuthStore((s) => s.user);
    const [mode, setMode] = useState(user?.anonymous ? "register" : "login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(null);

    const done = () => (router.canGoBack() ? goBack() : router.replace("/profile"));

    const submit = async () => {
        setError(null);
        if (mode === "register" && name.trim().length < 2) return setError(tr("auth.missingName"));
        if (!EMAIL_RE.test(email.trim())) return setError(tr("auth.invalidEmail"));
        if (mode === "register" && password.length < 8) return setError(tr("auth.shortPassword"));
        if (!password) return setError(tr("auth.missingPassword"));
        setBusy("email");
        try {
            await (mode === "login" ? login(email, password) : register(email, password, name));
            done();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(null);
        }
    };

    const anonymous = async () => {
        setError(null);
        setBusy("anon");
        try {
            await loginAnonymous();
            done();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(null);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <Screen>
                <ScreenHeader back title={tr(mode === "login" ? "auth.login" : "auth.register")} subtitle={tr("auth.subtitle")} />
                <View style={styles.body}>
                    <View style={[styles.segment, { backgroundColor: t.surfaceAlt }]}>
                        {[
                            { id: "login", label: tr("auth.login") },
                            { id: "register", label: tr("auth.registerTab") },
                        ].map((m) => (
                            <Pressable
                                key={m.id}
                                onPress={() => setMode(m.id)}
                                style={[styles.segmentItem, mode === m.id && { backgroundColor: t.background }]}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: mode === m.id }}
                            >
                                <Text style={{ color: mode === m.id ? t.text : t.textSecondary, fontWeight: "700" }}>{m.label}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Card style={{ gap: spacing.md }}>
                        {mode === "register" && (
                            <Field
                                label={tr("auth.name")}
                                value={name}
                                onChangeText={setName}
                                placeholder={tr("auth.namePlaceholder")}
                                maxLength={40}
                                autoComplete="name"
                                textContentType="name"
                            />
                        )}
                        <Field
                            label={tr("auth.email")}
                            value={email}
                            onChangeText={setEmail}
                            placeholder={tr("auth.emailPlaceholder")}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            textContentType="emailAddress"
                        />
                        <Field
                            label={tr("auth.password")}
                            value={password}
                            onChangeText={setPassword}
                            placeholder={mode === "register" ? tr("auth.passwordPlaceholderNew") : "••••••••"}
                            secureTextEntry
                            autoComplete={mode === "register" ? "new-password" : "current-password"}
                            textContentType={mode === "register" ? "newPassword" : "password"}
                            onSubmitEditing={submit}
                        />
                        {!!error && <Text style={[font.small, { color: t.danger }]}>{error}</Text>}
                        <Button title={tr(mode === "login" ? "auth.submitLogin" : "auth.submitRegister")} onPress={submit} loading={busy === "email"} disabled={!!busy} full />
                    </Card>

                    {!user && (
                        <>
                            <View style={styles.or}>
                                <View style={[styles.line, { backgroundColor: t.border }]} />
                                <Text style={[font.small, { color: t.textMuted }]}>{tr("auth.or")}</Text>
                                <View style={[styles.line, { backgroundColor: t.border }]} />
                            </View>
                            <Button title={tr("auth.anonymous")} icon="incognito" variant="ghost" onPress={anonymous} loading={busy === "anon"} disabled={!!busy} full />
                            <Text style={[font.tiny, { color: t.textMuted, textAlign: "center" }]}>
                                {tr("auth.anonymousNote")}
                            </Text>
                        </>
                    )}
                </View>
            </Screen>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    body: { paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: spacing.md, width: "100%", maxWidth: 480, alignSelf: "center" },
    segment: { flexDirection: "row", borderRadius: radius.pill, padding: 4 },
    segmentItem: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.pill },
    input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16 },
    or: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    line: { flex: 1, height: 1 },
});
