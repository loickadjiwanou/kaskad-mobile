import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/api";
import AppRow from "@/components/AppRow";
import Grid from "@/components/Grid";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import { EmptyState, ErrorState, Loading } from "@/components/States";
import { useI18n } from "@/i18n";
import { compatibleFirst } from "@/lib/platform";
import { useAsync } from "@/lib/useAsync";

/** Compte développeur : toutes ses apps publiées. */
export default function Developer() {
    const { t, lang } = useI18n();
    const { id } = useLocalSearchParams();
    const { data, error, loading, reload, refresh, refreshing } = useAsync(
        () => Promise.all([api.getDeveloper(id), api.listApps({ developer_id: id, sort: "popular", limit: 100 })]),
        [id, lang], // rechargé quand la langue change (descriptions traduites)
    );
    const [developer, list] = data ?? [];
    const items = useMemo(() => compatibleFirst(list?.items ?? []), [list]);

    return (
        <Screen onRefresh={refresh} refreshing={refreshing}>
            <ScreenHeader
                back
                title={developer?.name ?? t("developer.fallback")}
                subtitle={list ? t("common.apps", { count: list.total }) : undefined}
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
                <EmptyState icon="account-outline" title={t("developer.emptyTitle")} message={t("developer.emptyMessage")} />
            )}
        </Screen>
    );
}
