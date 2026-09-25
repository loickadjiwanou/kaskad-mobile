import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { api } from "@/api";
import { useI18n } from "@/i18n";
import { choose, toast } from "@/lib/dialog";
import { formatDate } from "@/lib/format";
import { font, radius, spacing, useTheme } from "@/theme";
import Icon from "./Icon";
import { Stars } from "./Stars";

export const REPORT_REASONS = ["malware", "abusive", "copyright", "misleading", "broken", "other"];

/** Signalement d'un avis (contenu abusif, spam…) : choix du motif puis envoi à la modération. */
export async function reportReview(review, tr) {
    const reason = await choose(tr("reviews.reportReviewTitle"), tr("reviews.reportReviewMessage"), [
        { label: tr("reviews.reasons.abusive"), value: "abusive" },
        { label: tr("reviews.reasons.misleading"), value: "misleading" },
        { label: tr("reviews.reasons.other"), value: "other" },
    ]);
    if (!reason) return;
    try {
        await api.reportReview(review.id, reason);
        toast(tr("reviews.reportSent"), { type: "success" });
    } catch (e) {
        toast(e.message, { type: "error" });
    }
}

/** Avis d'un utilisateur, avec la réponse publique du développeur. */
export default function ReviewItem({ review, onEdit }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    const [expanded, setExpanded] = useState(false);
    const r = review;
    const long = (r.body ?? "").length > 280;

    return (
        <View style={styles.root}>
            <View style={styles.head}>
                <View style={[styles.avatar, { backgroundColor: r.is_mine ? t.primary : t.primarySoft }]}>
                    <Text style={{ color: r.is_mine ? t.onPrimary : t.primary, fontWeight: "800" }}>{(r.author_name || "?")[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[font.body, { color: t.text, fontWeight: "700" }]} numberOfLines={1}>
                        {r.is_mine ? tr("reviews.yourReview") : r.author_name}
                    </Text>
                    <View style={styles.meta}>
                        <Stars value={r.rating} size={12} emptyColor={t.textMuted} />
                        <Text style={[font.tiny, { color: t.textMuted }]}>
                            {formatDate(r.updated_at)}
                            {r.version_name ? ` · v${r.version_name}` : ""}
                        </Text>
                    </View>
                </View>
                {r.is_mine ? (
                    onEdit && (
                        <Pressable onPress={onEdit} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr("reviews.edit")}>
                            <Icon name="pencil-outline" size={20} color={t.primary} />
                        </Pressable>
                    )
                ) : (
                    <Pressable onPress={() => reportReview(r, tr)} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr("reviews.reportReview")}>
                        <Icon name="flag-outline" size={18} color={t.textMuted} />
                    </Pressable>
                )}
            </View>
            {!!r.body && (
                <Pressable onPress={() => long && setExpanded(!expanded)} disabled={!long}>
                    <Text style={[font.body, { color: t.text }]} numberOfLines={long && !expanded ? 5 : undefined}>
                        {r.body}
                    </Text>
                    {long && <Text style={{ color: t.primary, fontWeight: "700", marginTop: 2 }}>{tr(expanded ? "app.readLess" : "app.readMore")}</Text>}
                </Pressable>
            )}
            {r.reply && (
                <View style={[styles.reply, { backgroundColor: t.surfaceAlt, borderLeftColor: t.primary }]}>
                    <View style={styles.replyHead}>
                        <Text style={[font.small, { color: t.text, fontWeight: "700", flex: 1 }]} numberOfLines={1}>
                            {tr("reviews.developerReply", { name: r.reply.author_name })}
                        </Text>
                        <Text style={[font.tiny, { color: t.textMuted }]}>{formatDate(r.reply.replied_at)}</Text>
                    </View>
                    <Text style={[font.small, { color: t.textSecondary, lineHeight: 19 }]}>{r.reply.body}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { gap: spacing.sm, paddingVertical: spacing.md },
    head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
    reply: { borderRadius: radius.md, padding: spacing.md, gap: 4, borderLeftWidth: 3 },
    replyHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
