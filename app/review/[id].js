import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TextInput } from "@/components/Text";
import { api } from "@/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import Screen from "@/components/Screen";
import ScreenHeader, { goBack } from "@/components/ScreenHeader";
import { EmptyState, Loading } from "@/components/States";
import { StarPicker } from "@/components/Stars";
import { useI18n } from "@/i18n";
import { confirm, toast } from "@/lib/dialog";
import { displayName, useAuthStore } from "@/store/auth";
import { useLibraryStore } from "@/store/library";
import { font, radius, spacing, useTheme } from "@/theme";

const MAX_LENGTH = 2000;

/** Noter une app et écrire / modifier / supprimer son avis (compte e-mail requis, un avis par app). */
export default function WriteReview() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const { id, name, rating: initialRating } = useLocalSearchParams();
    const user = useAuthStore((s) => s.user);
    const installed = useLibraryStore((s) => s.installed[id]);
    const canReview = !!user && !user.anonymous;

    const [loading, setLoading] = useState(true);
    const [existing, setExisting] = useState(null);
    const [rating, setRating] = useState(Number(initialRating) || 0);
    const [body, setBody] = useState("");
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!canReview) return setLoading(false);
        let alive = true;
        api.getMyReview(id)
            .then((r) => {
                if (!alive || !r) return;
                setExisting(r);
                setRating((v) => (initialRating ? v : r.rating));
                setBody(r.body ?? "");
            })
            .catch(() => {})
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [id, canReview, initialRating]);

    const done = () => (router.canGoBack() ? goBack() : router.replace(`/app/${id}`));

    const save = async () => {
        if (!rating) return setError(tr("reviews.pickRating"));
        setError(null);
        setBusy("save");
        try {
            await api.saveMyReview(id, { rating, body, version_name: installed?.version_name ?? existing?.version_name ?? null });
            toast(tr(existing ? "reviews.updated" : "reviews.published"), { type: "success" });
            done();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(null);
        }
    };

    const remove = async () => {
        if (!(await confirm(tr("reviews.deleteTitle"), tr("reviews.deleteMessage"), { confirmText: tr("reviews.delete"), destructive: true }))) return;
        setBusy("delete");
        try {
            await api.deleteMyReview(id);
            toast(tr("reviews.deleted"), { type: "info" });
            done();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(null);
        }
    };

    return (
        <Screen edges={["top", "left", "right", "bottom"]}>
            <ScreenHeader back title={tr(existing ? "reviews.editTitle" : "reviews.writeTitle")} subtitle={name} />
            {loading ? (
                <Loading />
            ) : !canReview ? (
                <EmptyState
                    icon="account-star-outline"
                    title={tr("reviews.emailRequiredTitle")}
                    message={tr("reviews.emailRequired")}
                    action={<Button title={tr(user ? "reviews.addEmail" : "profile.signIn")} icon="login" onPress={() => router.push("/auth")} />}
                />
            ) : (
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.body}>
                    <Card style={{ gap: spacing.lg }}>
                        <View style={styles.stars}>
                            <StarPicker value={rating} onChange={setRating} size={42} emptyColor={t.textMuted} />
                            <Text style={[font.body, { color: rating ? t.text : t.textMuted, fontWeight: "700" }]}>
                                {rating ? tr(`reviews.ratingLabels.${rating}`) : tr("reviews.tapToRate")}
                            </Text>
                        </View>
                        <View style={[styles.author, { backgroundColor: t.surfaceAlt }]}>
                            <Icon name="account-circle-outline" size={20} color={t.textSecondary} />
                            <Text style={[font.small, { color: t.textSecondary, flex: 1 }]}>
                                {tr("reviews.postingAs")} <Text style={{ color: t.text, fontWeight: "700" }}>{displayName(user)}</Text>
                            </Text>
                            <Text style={{ color: t.primary, fontWeight: "700" }} onPress={() => router.push("/account-name")}>
                                {tr("reviews.changeName")}
                            </Text>
                        </View>
                        <View style={{ gap: 6 }}>
                            <Text style={[font.small, { color: t.textSecondary, fontWeight: "600" }]}>{tr("reviews.bodyLabel")}</Text>
                            <TextInput
                                value={body}
                                onChangeText={setBody}
                                maxLength={MAX_LENGTH}
                                multiline
                                textAlignVertical="top"
                                placeholder={tr("reviews.bodyPlaceholder")}
                                placeholderTextColor={t.textMuted}
                                style={[styles.input, styles.textarea, { color: t.text, borderColor: t.border, backgroundColor: t.background }]}
                            />
                            <Text style={[font.tiny, { color: t.textMuted, alignSelf: "flex-end" }]}>
                                {body.length} / {MAX_LENGTH}
                            </Text>
                        </View>
                        <Text style={[font.small, { color: t.textSecondary }]}>{tr("reviews.publicNote")}</Text>
                        {!!error && <Text style={[font.small, { color: t.danger }]}>{error}</Text>}
                        <Button title={tr(existing ? "reviews.update" : "reviews.publish")} icon="send" onPress={save} loading={busy === "save"} disabled={!!busy} full />
                        {existing && (
                            <Button title={tr("reviews.delete")} icon="delete-outline" variant="danger" onPress={remove} loading={busy === "delete"} disabled={!!busy} full />
                        )}
                    </Card>
                </KeyboardAvoidingView>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    body: { paddingHorizontal: spacing.lg, marginTop: spacing.md, width: "100%", maxWidth: 640, alignSelf: "center" },
    stars: { alignItems: "center", gap: spacing.sm },
    author: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
    input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16 },
    textarea: { minHeight: 130 },
});
