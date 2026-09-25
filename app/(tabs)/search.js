import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/api";
import AppRow from "@/components/AppRow";
import Chip from "@/components/Chip";
import ScreenHeader from "@/components/ScreenHeader";
import { useTabBarInset, useTabBarScroll } from "@/components/GlassTabBar";
import SearchBar from "@/components/SearchBar";
import { TOP_ADJUST } from "@/components/Screen";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { useI18n } from "@/i18n";
import { useCategories, useColumns } from "@/lib/hooks";
import { compatibleFirst, detectPlatform, PLATFORMS } from "@/lib/platform";
import { useAsync } from "@/lib/useAsync";
import { font, spacing, useTheme } from "@/theme";
import { SafeAreaView } from "react-native-safe-area-context";

// Résultats chargés par pages : la suite arrive automatiquement en fin de liste
const PAGE_SIZE = 30;

const SORTS = [
    { id: "popular", label: "search.sortPopular", icon: "fire" },
    { id: "recent", label: "search.sortRecent", icon: "clock-outline" },
    { id: "name", label: "search.sortName", icon: "sort-alphabetical-ascending" },
];

function useDebounced(value, ms = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setV(value), ms);
        return () => clearTimeout(id);
    }, [value, ms]);
    return v;
}

export default function Search() {
    const t = useTheme();
    const { t: tr, lang } = useI18n();
    const tabBarInset = useTabBarInset();
    const cols = useColumns({ max: 3 });
    const onScroll = useTabBarScroll();
    const params = useLocalSearchParams();
    const categories = useCategories();
    const { target } = detectPlatform();

    const [query, setQuery] = useState(params.q ?? "");
    const [categoryId, setCategoryId] = useState(params.category_id ?? null);
    const [platform, setPlatform] = useState(params.platform ?? null);
    const [sort, setSort] = useState(params.sort ?? "popular");
    const q = useDebounced(query);

    useEffect(() => {
        if (params.sort) setSort(params.sort);
    }, [params.sort]);

    const filters = { q, category_id: categoryId ?? undefined, platform: platform ?? undefined, sort };
    const { data, error, loading, reload } = useAsync(
        () => api.listApps({ ...filters, page: 1, limit: PAGE_SIZE }),
        [q, categoryId, platform, sort, lang],
    );

    // Pages suivantes (réinitialisées à chaque nouvelle recherche)
    const [more, setMore] = useState({ items: [], page: 1, loading: false });
    const generation = useRef(0);
    useEffect(() => {
        generation.current += 1;
        setMore({ items: [], page: 1, loading: false });
    }, [data]);

    const items = useMemo(() => {
        const first = data?.items ?? [];
        // Apps compatibles avec l'appareil en tête de la première page (sauf filtre plateforme ou tri alphabétique)
        return [...(platform || sort === "name" ? first : compatibleFirst(first)), ...more.items];
    }, [data, more.items, platform, sort]);
    const hasMore = !!data && items.length < data.total;

    const loadMore = async () => {
        if (!hasMore || more.loading || loading) return;
        const gen = generation.current;
        setMore((m) => ({ ...m, loading: true }));
        try {
            const next = await api.listApps({ ...filters, page: more.page + 1, limit: PAGE_SIZE });
            if (gen !== generation.current) return; // recherche modifiée entre-temps
            setMore((m) => ({ items: [...m.items, ...next.items], page: m.page + 1, loading: false }));
        } catch {
            if (gen === generation.current) setMore((m) => ({ ...m, loading: false }));
        }
    };

    const header = (
        <View style={styles.filters}>
            <View style={styles.pad}>
                <SearchBar value={query} onChangeText={setQuery} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {PLATFORMS.map((p) => (
                    <Chip
                        key={p.id}
                        label={p.id === target ? tr("search.thisDevice", { platform: p.label }) : p.label}
                        icon={p.icon}
                        selected={platform === p.id}
                        onPress={() => setPlatform(platform === p.id ? null : p.id)}
                    />
                ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Chip label={tr("search.all")} selected={!categoryId} onPress={() => setCategoryId(null)} />
                {categories.map((c) => (
                    <Chip
                        key={c.id}
                        label={c.name}
                        icon={c.icon}
                        selected={categoryId === c.id}
                        onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                    />
                ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {SORTS.map((s) => (
                    <Chip key={s.id} label={tr(s.label)} icon={s.icon} selected={sort === s.id} onPress={() => setSort(s.id)} />
                ))}
            </ScrollView>
            <Text style={[font.small, styles.pad, { color: t.textSecondary, fontWeight: "600" }]}>
                {data ? tr("common.apps", { count: data.total }) : " "}
            </Text>
        </View>
    );

    return (
        <SafeAreaView edges={["top", "left", "right"]} style={[styles.root, { backgroundColor: t.background }]}>
            <View style={styles.inner}>
                <ScreenHeader title={tr("search.title")} />
                <FlatList
                    // Nombre de colonnes selon la largeur ; la clé force le re-rendu quand il change
                    key={`cols-${cols}`}
                    numColumns={cols}
                    data={loading || error ? [] : items}
                    keyExtractor={(a) => a.id}
                    renderItem={({ item }) =>
                        cols > 1 ? (
                            <View style={{ width: `${100 / cols}%` }}>
                                <AppRow app={item} />
                            </View>
                        ) : (
                            <AppRow app={item} />
                        )
                    }
                    ListHeaderComponent={header}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingBottom: tabBarInset }}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={more.loading ? <ActivityIndicator color={t.primary} style={styles.footer} /> : null}
                    ListEmptyComponent={
                        loading ? (
                            <Loading />
                        ) : error ? (
                            <ErrorState error={error} onRetry={reload} />
                        ) : (
                            <EmptyState icon="magnify-close" title={tr("search.noResults")} message={tr("search.noResultsMessage")} />
                        )
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    inner: { flex: 1, width: "100%", marginTop: TOP_ADJUST },
    filters: { gap: spacing.md, paddingBottom: spacing.sm },
    pad: { paddingHorizontal: spacing.lg },
    chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    footer: { paddingVertical: spacing.lg },
});
