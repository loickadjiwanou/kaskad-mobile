import { FlatList, Image, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import { api } from "@/api";
import AppRow from "@/components/AppRow";
import AppTile from "@/components/AppTile";
import Chip from "@/components/Chip";
import FeaturedCard from "@/components/FeaturedCard";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import Screen from "@/components/Screen";
import SectionHeader from "@/components/SectionHeader";
import { ErrorState, Loading } from "@/components/States";
import { useI18n } from "@/i18n";
import Grid from "@/components/Grid";
import { columnsFor, useCategories } from "@/lib/hooks";
import { detectPlatform, formatLabel, platformIcon, platformLabel } from "@/lib/platform";
import { useAsync } from "@/lib/useAsync";
import { font, radius, spacing, useTheme } from "@/theme";

function DeviceBanner() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const { target, preferredFormats } = detectPlatform();
    const text = target
        ? tr("home.deviceBanner", { formats: preferredFormats.map(formatLabel).join(" / "), platform: platformLabel(target) })
        : tr("home.deviceBannerNone");
    return (
        <View style={[styles.banner, { backgroundColor: t.primarySoft }]}>
            <Icon name={target ? platformIcon(target) : "information-outline"} size={18} color={t.primary} />
            <Text style={[font.small, { color: t.text, flex: 1 }]}>{text}</Text>
        </View>
    );
}

export default function Home() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const { width } = useWindowDimensions();
    const cols = columnsFor(width);
    const categories = useCategories();
    const { data, error, loading, refreshing, reload, refresh } = useAsync(
        () => api.getHome({ platform: detectPlatform().target ?? undefined }),
        [],
    );

    // Cartes "En vedette" : 2 à 4 visibles selon la largeur (tablette paysage, desktop), une + aperçu sur téléphone
    const featuredCount = width >= 1400 ? 4 : width >= 900 ? 3 : width >= 600 ? 2 : 1;
    const featuredWidth =
        featuredCount > 1 ? (width - spacing.lg * 2 - spacing.md * (featuredCount - 1)) / featuredCount : Math.min(width - 48, 420);
    const popularCount = cols === 1 ? 5 : cols * Math.floor(8 / cols);

    return (
        <Screen onRefresh={refresh} refreshing={refreshing}>
            <View style={styles.header}>
                <Image source={require("@assets/icons/kaskad_transparent.png")} style={styles.logo} />
                <Text style={[font.h1, { color: t.text, flex: 1 }]}>Kaskad</Text>
                <IconButton name="help-circle-outline" onPress={() => router.push("/faq")} label={tr("home.help")} />
                <IconButton name="heart-outline" onPress={() => router.push("/favorites")} label={tr("home.favorites")} />
            </View>
            <DeviceBanner />

            {loading ? (
                <Loading />
            ) : error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : (
                <>
                    {!!data.featured?.length && (
                        <>
                            <SectionHeader title={tr("home.featured")} />
                            <FlatList
                                horizontal
                                data={data.featured}
                                keyExtractor={(a) => a.id}
                                renderItem={({ item }) => <FeaturedCard app={item} width={featuredWidth} />}
                                contentContainerStyle={styles.hList}
                                ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
                                showsHorizontalScrollIndicator={false}
                                snapToInterval={featuredWidth + spacing.md}
                                decelerationRate="fast"
                            />
                        </>
                    )}

                    {!!categories.length && (
                        <>
                            <SectionHeader title={tr("home.categories")} />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                                {categories.map((c) => (
                                    <Chip key={c.id} label={c.name} icon={c.icon} onPress={() => router.push(`/category/${c.id}`)} />
                                ))}
                            </ScrollView>
                        </>
                    )}

                    <SectionHeader
                        title={tr("home.new")}
                        onAction={() => router.push({ pathname: "/search", params: { sort: "recent" } })}
                    />
                    <FlatList
                        horizontal
                        data={data.new}
                        keyExtractor={(a) => a.id}
                        renderItem={({ item }) => <AppTile app={item} />}
                        contentContainerStyle={styles.hList}
                        showsHorizontalScrollIndicator={false}
                    />

                    <SectionHeader
                        title={tr("home.popular")}
                        onAction={() => router.push({ pathname: "/search", params: { sort: "popular" } })}
                    />
                    <Grid max={3}>
                        {data.popular.slice(0, popularCount).map((app, i) => (
                            <AppRow
                                key={app.id}
                                app={app}
                                right={<Text style={[font.h3, { color: t.textMuted, width: 24, textAlign: "right" }]}>{i + 1}</Text>}
                            />
                        ))}
                    </Grid>
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    logo: { width: 36, height: 36, resizeMode: "contain" },
    banner: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
    },
    hList: { paddingHorizontal: spacing.lg },
    chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
});
