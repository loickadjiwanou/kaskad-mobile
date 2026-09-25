import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Text } from "@/components/Text";
import { api } from "@/api";
import { t as translate, useI18n } from "@/i18n";
import { toast } from "@/lib/dialog";
import { useAsync } from "@/lib/useAsync";
import { useAuthStore } from "@/store/auth";
import { font, spacing, useTheme } from "@/theme";
import Card from "./Card";
import RatingSummary from "./RatingSummary";
import ReviewItem from "./ReviewItem";
import SectionHeader from "./SectionHeader";
import { StarPicker } from "./Stars";

/** Rédaction d'un avis : compte e-mail requis (sinon invitation à se connecter). */
export function openReviewComposer(app, rating) {
    const user = useAuthStore.getState().user;
    if (!user || user.anonymous) {
        toast(translate("reviews.emailRequired"), {
            action: { label: translate(user ? "reviews.addEmail" : "profile.signIn"), onPress: () => router.push("/auth") },
        });
        return;
    }
    router.push({ pathname: "/review/[id]", params: { id: app.id, name: app.name, ...(rating ? { rating: String(rating) } : {}) } });
}

/** Section « Notes et avis » de la fiche : note, mon avis (ou noter l'app), avis récents. */
export default function ReviewsSection({ app, onRating }) {
    const t = useTheme();
    const { t: tr, lang } = useI18n();
    const user = useAuthStore((s) => s.user);
    const canReview = !!user && !user.anonymous;

    // Recharge au retour sur la fiche (après avoir écrit / modifié un avis)
    const [tick, setTick] = useState(0);
    const first = useRef(true);
    useFocusEffect(
        useCallback(() => {
            if (first.current) first.current = false;
            else setTick((x) => x + 1);
        }, []),
    );
    const { data } = useAsync(() => api.getReviews(app.id, { limit: 4 }), [app.id, tick, lang, user?.id]);
    const { data: mine } = useAsync(() => (canReview ? api.getMyReview(app.id) : Promise.resolve(null)), [app.id, tick, canReview]);

    const rating = data?.rating ?? { average: app.rating_average, count: app.rating_count ?? 0, distribution: app.rating_distribution };
    // La fiche affiche la note à jour dans son en-tête (après un nouvel avis ou une modification)
    useEffect(() => {
        if (data?.rating) onRating?.(data.rating);
    }, [data, onRating]);
    const others = (data?.items ?? []).filter((r) => !r.is_mine).slice(0, 3);

    return (
        <>
            <SectionHeader
                title={tr("reviews.title")}
                onAction={rating.count ? () => router.push({ pathname: "/reviews/[id]", params: { id: app.id, name: app.name } }) : undefined}
            />
            <View style={styles.section}>
                <Card style={{ gap: spacing.lg }}>
                    <RatingSummary {...rating} />
                    <View style={[styles.divider, { backgroundColor: t.border }]} />
                    {mine ? (
                        <ReviewItem review={mine} onEdit={() => openReviewComposer(app)} />
                    ) : (
                        <View style={styles.rate}>
                            <Text style={[font.h3, { color: t.text }]}>{tr("reviews.rateTitle")}</Text>
                            <Text style={[font.small, { color: t.textSecondary, textAlign: "center" }]}>{tr("reviews.rateMessage")}</Text>
                            <StarPicker value={0} size={34} emptyColor={t.textMuted} onChange={(n) => openReviewComposer(app, n)} />
                        </View>
                    )}
                    {others.length > 0 && (
                        <View>
                            {others.map((r, i) => (
                                <View key={r.id} style={i > 0 && [styles.itemBorder, { borderTopColor: t.border }]}>
                                    <ReviewItem review={r} />
                                </View>
                            ))}
                        </View>
                    )}
                    {!rating.count && !mine && <Text style={[font.small, { color: t.textMuted, textAlign: "center" }]}>{tr("reviews.beFirst")}</Text>}
                </Card>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    section: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
    divider: { height: 1 },
    rate: { alignItems: "center", gap: spacing.sm },
    itemBorder: { borderTopWidth: 1 },
});
