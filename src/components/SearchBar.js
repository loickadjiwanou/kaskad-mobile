import { StyleSheet, View } from "react-native";
import { TextInput } from "@/components/Text";
import { useI18n } from "@/i18n";
import { radius, spacing, useTheme } from "@/theme";
import Icon from "./Icon";
import IconButton from "./IconButton";

export default function SearchBar({ value, onChangeText, onSubmit, autoFocus, placeholder }) {
    const t = useTheme();
    const { t: tr } = useI18n();
    return (
        <View style={[styles.wrap, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Icon name="magnify" size={20} color={t.textMuted} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                onSubmitEditing={onSubmit}
                placeholder={placeholder ?? tr("search.placeholder")}
                placeholderTextColor={t.textMuted}
                autoFocus={autoFocus}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                style={[styles.input, { color: t.text }]}
                accessibilityLabel={tr("search.title")}
            />
            {!!value && <IconButton name="close-circle" size={18} color={t.textMuted} onPress={() => onChangeText("")} label={tr("common.clear")} />}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingLeft: spacing.lg,
        paddingRight: spacing.xs,
        minHeight: 48,
    },
    input: { flex: 1, fontSize: 16, paddingVertical: 10, outlineStyle: "none" },
});
