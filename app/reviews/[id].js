import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/api";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import RatingSummary from "@/components/RatingSummary";
import ReviewItem from "@/components/ReviewItem";
import { openReviewComposer } from "@/components/ReviewsSection";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { useI18n } from "@/i18n";
import { useAsync } from "@/lib/useAsync";
import { spacing, useTheme } from "@/theme";

const PAGE_SIZE = 20;
const SORTS = ["recent", "rating_desc", "rating_asc"];

/** Tous les avis d'une app : tri, filtre par note, pagination. */
export default function AppReviews() {
    const t = useTheme();
    const { t: tr, lang } = useI18n();
    const { id, name } = useLocalSearchParams();
    const [sort, setSort] = useState("recent");
    const [rating, setRating] = useState(null);
    const [extra, setExtra] = useState({ items: [], page: 1, loading: false });

    const { data, error, loading, reload, refresh, refreshing } = useAsync(async () => {
        setExtra({ items: [], page: 1, loading: false });
        return api.getReviews(id, { sort, rating: rating ?? undefined, page: 1, limit: PAGE_SIZE });
    }, [id, sort, rating, lang]);

    const items = [...(data?.items ?? []), ...extra.items];
    const more = data && items.length < data.total;
    const loadMore = async () => {
        setExtra((s) => ({ ...s, loading: true }));
        try {
            const next = await api.getReviews(id, { sort, rating: rating ?? undefined, page: extra.page + 1, limit: PAGE_SIZE });
            setExtra((s) => ({ items: [...s.items, ...next.items], page: s.page + 1, loading: false }));
        } catch {
            setExtra((s) => ({ ...s, loading: false }));
        }
    };

    return (
        <Screen onRefresh={refresh} refreshing={refreshing}>
            <ScreenHeader back title={tr("reviews.title")} subtitle={name} />
            {data?.rating && (
                <View style={styles.section}>
                    <Card>
                        <RatingSummary {...data.rating} />
                    </Card>
                </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {SORTS.map((s) => (
                    <Chip key={s} label={tr(`reviews.sort.${s}`)} selected={sort === s} onPress={() => setSort(s)} />
                ))}
                <View style={[styles.sep, { backgroundColor: t.border }]} />
                <Chip label={tr("reviews.allRatings")} selected={!rating} onPress={() => setRating(null)} />
                {[5, 4, 3, 2, 1].map((n) => (
                    <Chip key={n} label={`${n} ★`} selected={rating === n} onPress={() => setRating(rating === n ? null : n)} />
                ))}
            </ScrollView>
            {loading && !data ? (
                <Loading />
            ) : error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : items.length === 0 ? (
                <EmptyState
                    icon="star-outline"
                    title={tr(rating ? "reviews.emptyFiltered" : "reviews.empty")}
                    action={!rating && <Button title={tr("reviews.write")} icon="star-outline" onPress={() => openReviewComposer({ id, name })} />}
                />
            ) : (
                <View style={styles.section}>
                    <Card>
                        {items.map((r, i) => (
                            <View key={r.id} style={i > 0 && [styles.itemBorder, { borderTopColor: t.border }]}>
                                <ReviewItem review={r} onEdit={() => openReviewComposer({ id, name })} />
                            </View>
                        ))}
                    </Card>
                    {more && <Button title={tr("reviews.loadMore")} variant="ghost" loading={extra.loading} onPress={loadMore} style={{ marginTop: spacing.md }} full />}
                </View>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    section: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
    chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, alignItems: "center" },
    sep: { width: 1, height: 22, marginHorizontal: spacing.xs },
    itemBorder: { borderTopWidth: 1 },
});
