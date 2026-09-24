import { router } from "expo-router";
import AppRow from "@/components/AppRow";
import Button from "@/components/Button";
import Grid from "@/components/Grid";
import IconButton from "@/components/IconButton";
import Screen from "@/components/Screen";
import ScreenHeader from "@/components/ScreenHeader";
import { EmptyState } from "@/components/States";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/store/auth";
import { useLibraryStore } from "@/store/library";
import { useTheme } from "@/theme";

export default function Favorites() {
    const t = useTheme();
    const { t: tr } = useI18n();
    const user = useAuthStore((s) => s.user);
    const favorites = useLibraryStore((s) => s.favorites);
    const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
    const list = Object.values(favorites).sort((a, b) => a.name.localeCompare(b.name, "fr"));

    return (
        <Screen>
            <ScreenHeader
                back
                title={tr("favorites.title")}
                subtitle={list.length ? tr("common.apps", { count: list.length }) : undefined}
            />
            {!user ? (
                <EmptyState
                    icon="account-heart-outline"
                    title={tr("favorites.signedOutTitle")}
                    message={tr("favorites.signedOutMessage")}
                    action={<Button title={tr("profile.signIn")} icon="login" onPress={() => router.push("/auth")} />}
                />
            ) : list.length ? (
                <Grid max={3}>
                    {list.map((app) => (
                        <AppRow
                            key={app.id}
                            app={app}
                            right={
                                <IconButton
                                    name="heart"
                                    color={t.danger}
                                    onPress={() => toggleFavorite(app)}
                                    label={tr("app.removeFavorite")}
                                />
                            }
                        />
                    ))}
                </Grid>
            ) : (
                <EmptyState
                    icon="heart-outline"
                    title={tr("favorites.emptyTitle")}
                    message={tr("favorites.emptyMessage")}
                    action={<Button title={tr("common.explore")} icon="compass-outline" onPress={() => router.dismissTo("/")} />}
                />
            )}
        </Screen>
    );
}
