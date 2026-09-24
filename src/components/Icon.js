import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Icon({ name, size = 22, color, style }) {
    return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
}
