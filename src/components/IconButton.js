import { Pressable } from "react-native";
import { useTheme } from "@/theme";
import Icon from "./Icon";

export default function IconButton({ name, onPress, color, size = 22, label, style }) {
    const t = useTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={8}
            style={({ pressed }) => [
                { padding: 8, borderRadius: 999, backgroundColor: pressed ? t.surfaceAlt : "transparent" },
                style,
            ]}
        >
            <Icon name={name} size={size} color={color ?? t.text} />
        </Pressable>
    );
}
