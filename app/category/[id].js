import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/api";
import AppRow from "@/components/AppRow";
import Grid from "@/components/Grid";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { useI18n } from "@/i18n";
import { useCategories } from "@/lib/hooks";
import { compatibleFirst } from "@/lib/platform";
import { useAsync } from "@/lib/useAsync";

export default function Category() {
    const { t } = useI18n();
    const { id } = useLocalSearchParams();
    const category = useCategories().find((c) => c.id === id);
    const { data, error, loading, reload, refresh, refreshing } = useAsync(
        () => api.listApps({ category_id: id, sort: "popular", limit: 100 }),
        [id],
    );
    const items = useMemo(() => compatibleFirst(data?.items ?? []), [data]);

    return (
        <Screen onRefresh={refresh} refreshing={refreshing}>
            <ScreenHeader
                back
                title={category?.name ?? t("category.fallback")}
                subtitle={data ? t("common.apps", { count: data.total }) : undefined}
            />
            {loading ? (
                <Loading />
            ) : error ? (
                <ErrorState error={error} onRetry={reload} />
            ) : items.length ? (
                <Grid max={3}>
                    {items.map((a) => (
                        <AppRow key={a.id} app={a} />
                    ))}
                </Grid>
            ) : (
                <EmptyState icon="shape-outline" title={t("category.emptyTitle")} message={t("category.emptyMessage")} />
            )}
        </Screen>
    );
}
